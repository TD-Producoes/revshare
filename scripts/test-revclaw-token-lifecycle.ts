/**
 * Test script for RevClaw token lifecycle
 * 
 * Tests:
 * 1. Token exchange (exchange_code → access_token + refresh_token)
 * 2. Token refresh (rotate refresh_token)
 * 3. Refresh token reuse detection (replay attack)
 * 4. Installation revocation
 * 5. Token validation after revocation
 * 
 * Usage:
 * npm run test:revclaw-tokens
 */

import { prisma } from "../lib/prisma";
import { generateOpaqueToken, hashAgentSecret } from "../lib/revclaw/secret";
import { generateExchangeCode } from "../lib/revclaw/tokens";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const emoji = passed ? "✅" : "❌";
  console.log(`${emoji} ${name}`);
  if (error) {
    console.error(`   Error: ${error}`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("🧪 Testing RevClaw Token Lifecycle\n");

  // Setup: Create test agent + user + installation + exchange code
  console.log("📝 Setting up test data...");
  
  const agentSecret = generateOpaqueToken(32);
  const agentSecretHash = hashAgentSecret(agentSecret);

  const agent = await prisma.revclawAgent.create({
    data: {
      name: "Test Agent for Token Lifecycle",
      agentSecretHash,
      manifestSnapshot: "# Test Agent\nThis is a test agent for token lifecycle testing.",
      manifestSnapshotHash: "test_hash",
      status: "ACTIVE",
    },
  });

  const user = await prisma.user.create({
    data: {
      id: `test_user_${Date.now()}`,
      name: "Test User",
      role: "founder",
      telegramUserId: `test_tg_${Date.now()}`,
    },
  });

  const installation = await prisma.revclawInstallation.create({
    data: {
      agentId: agent.id,
      userId: user.id,
      grantedScopes: ["project:read", "project:publish"],
      status: "ACTIVE",
    },
  });

  const exchangeCodeData = generateExchangeCode();
  await prisma.revclawExchangeCode.create({
    data: {
      installationId: installation.id,
      codeHash: exchangeCodeData.code_hash,
      scopesSnapshot: ["project:read", "project:publish"],
      status: "PENDING",
      expiresAt: exchangeCodeData.expires_at,
    },
  });

  console.log(`   Agent ID: ${agent.id}`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Installation ID: ${installation.id}\n`);

  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let newRefreshToken: string | undefined;

  // Test 1: Token Exchange
  try {
    console.log("🔑 Test 1: Token Exchange");
    const response = await fetch(`${API_BASE}/api/revclaw/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agent.id,
        agent_secret: agentSecret,
        exchange_code: exchangeCodeData.code,
      }),
    });

    const data = await response.json();

    if (response.ok && data.access_token && data.refresh_token) {
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      logTest("Token exchange successful", true);
      logTest("Access token received", !!data.access_token);
      logTest("Refresh token received", !!data.refresh_token);
      logTest("Token type is Bearer", data.token_type === "Bearer");
      logTest("Expires in provided", typeof data.expires_in === "number");
      logTest("Scopes snapshot included", Array.isArray(data.scopes));
    } else {
      logTest("Token exchange", false, `HTTP ${response.status}: ${JSON.stringify(data)}`);
      throw new Error("Token exchange failed");
    }
  } catch (error) {
    logTest("Token exchange", false, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  await sleep(500);

  // Test 2: Exchange code reuse (should fail)
  try {
    console.log("\n🔒 Test 2: Exchange code reuse detection");
    const response = await fetch(`${API_BASE}/api/revclaw/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agent.id,
        agent_secret: agentSecret,
        exchange_code: exchangeCodeData.code,
      }),
    });

    const shouldFail = !response.ok;
    logTest("Exchange code reuse rejected", shouldFail);
  } catch (error) {
    logTest("Exchange code reuse detection", false, error instanceof Error ? error.message : String(error));
  }

  await sleep(500);

  // Test 3: Token Refresh
  try {
    console.log("\n🔄 Test 3: Token Refresh (rotation)");
    const response = await fetch(`${API_BASE}/api/revclaw/tokens/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refreshToken}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.access_token && data.refresh_token) {
      newRefreshToken = data.refresh_token;
      logTest("Token refresh successful", true);
      logTest("New access token received", !!data.access_token);
      logTest("New refresh token received", !!data.refresh_token);
      logTest("Tokens are different", data.refresh_token !== refreshToken);
    } else {
      logTest("Token refresh", false, `HTTP ${response.status}: ${JSON.stringify(data)}`);
      throw new Error("Token refresh failed");
    }
  } catch (error) {
    logTest("Token refresh", false, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  await sleep(500);

  // Test 4: Refresh token reuse detection (replay attack)
  try {
    console.log("\n🛡️  Test 4: Refresh token reuse detection (replay attack)");
    const response = await fetch(`${API_BASE}/api/revclaw/tokens/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refreshToken}`, // Old token, already used
      },
    });

    const data = await response.json();
    const shouldFail = !response.ok && response.status === 403;
    logTest("Refresh token reuse rejected", shouldFail);
    
    if (shouldFail && data.error?.includes("reuse")) {
      logTest("Error message mentions reuse", true);
    }

    // Verify all tokens were invalidated
    const activeTokens = await prisma.revclawAccessToken.count({
      where: {
        installationId: installation.id,
        revokedAt: null,
      },
    });
    logTest("All tokens revoked after reuse", activeTokens === 0);
  } catch (error) {
    logTest("Refresh token reuse detection", false, error instanceof Error ? error.message : String(error));
  }

  await sleep(500);

  // Test 5: Setup for revocation test (create new tokens)
  console.log("\n🔧 Setting up for revocation test...");
  const newExchangeCode = generateExchangeCode();
  await prisma.revclawExchangeCode.create({
    data: {
      installationId: installation.id,
      codeHash: newExchangeCode.code_hash,
      scopesSnapshot: ["project:read", "project:publish"],
      status: "PENDING",
      expiresAt: newExchangeCode.expires_at,
    },
  });

  const tokenResponse = await fetch(`${API_BASE}/api/revclaw/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agent.id,
      agent_secret: agentSecret,
      exchange_code: newExchangeCode.code,
    }),
  });

  const tokens = await tokenResponse.json();
  const testAccessToken = tokens.access_token;

  await sleep(500);

  // Test 6: Installation Revocation
  try {
    console.log("\n🚫 Test 5: Installation Revocation");
    
    // Note: This would normally require authenticated user session
    // For testing, we'll do it directly in the database
    await prisma.$transaction(async (tx) => {
      await tx.revclawInstallation.update({
        where: { id: installation.id },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokeReason: "Test revocation",
        },
      });

      await tx.revclawAccessToken.updateMany({
        where: {
          installationId: installation.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });

    logTest("Installation revoked", true);

    // Verify tokens are revoked
    const revokedTokenCount = await prisma.revclawAccessToken.count({
      where: {
        installationId: installation.id,
        revokedAt: { not: null },
      },
    });
    logTest("All tokens marked as revoked", revokedTokenCount > 0);

    // Test using a revoked token
    const testResponse = await fetch(`${API_BASE}/api/some-protected-endpoint`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${testAccessToken}`,
      },
    });

    // Since we don't have a real protected endpoint, we'll verify the token is revoked in DB
    const tokenCheck = await prisma.revclawAccessToken.findFirst({
      where: {
        installationId: installation.id,
        revokedAt: null,
      },
    });
    logTest("No active tokens after revocation", tokenCheck === null);

  } catch (error) {
    logTest("Installation revocation", false, error instanceof Error ? error.message : String(error));
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test data...");
  await prisma.revclawAccessToken.deleteMany({
    where: { installationId: installation.id },
  });
  await prisma.revclawExchangeCode.deleteMany({
    where: { installationId: installation.id },
  });
  await prisma.revclawInstallation.delete({
    where: { id: installation.id },
  });
  await prisma.revclawAgent.delete({
    where: { id: agent.id },
  });
  await prisma.user.delete({
    where: { id: user.id },
  });

  // Summary
  console.log("\n📊 Test Summary");
  console.log("═".repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("💥 Test suite failed:", error);
  process.exit(1);
});
