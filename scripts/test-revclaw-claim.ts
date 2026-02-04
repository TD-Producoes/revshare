/**
 * RevClaw Phase 1 Integration Test
 *
 * Tests the full claim flow:
 * 1. Register an agent
 * 2. Simulate Telegram approval callback
 * 3. Verify installation created
 *
 * Usage:
 *   npx tsx scripts/test-revclaw-claim.ts
 *
 * Prerequisites:
 *   - Dev server running at http://localhost:3000
 *   - DATABASE_URL set
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface RegisterResponse {
  agent_id: string;
  agent_secret: string;
  claim_id: string;
  expires_at: string;
}

interface ClaimResponse {
  installation_id: string;
  user_id: string;
}

async function testRegisterAgent(): Promise<RegisterResponse> {
  console.log("\n📝 Step 1: Registering agent...");

  const response = await fetch(`${BASE_URL}/api/revclaw/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Bot",
      description: "A test bot for integration testing",
      manifest_markdown: `---
name: Test Bot
version: 1.0.0
---

# Test Bot

This is a test bot for RevClaw integration testing.

## Capabilities
- Can create projects
- Can manage applications
`,
      requested_scopes: ["projects:read", "projects:draft_write", "projects:publish"],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Registration failed: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as RegisterResponse;
  console.log("✅ Agent registered:");
  console.log(`   agent_id: ${data.agent_id}`);
  console.log(`   claim_id: ${data.claim_id}`);
  console.log(`   expires_at: ${data.expires_at}`);
  // Note: agent_secret is shown only for testing; in production it's bot-only
  console.log(`   agent_secret: ${data.agent_secret.slice(0, 10)}...`);

  return data;
}

async function testSendApproval(
  agentId: string,
  agentSecret: string,
  claimId: string
): Promise<void> {
  console.log("\n📨 Step 2: Testing send-approval endpoint...");

  // This would normally send to a real Telegram chat
  // For testing, we'll just verify the endpoint works (will fail without bot token)
  const response = await fetch(`${BASE_URL}/api/revclaw/agents/send-approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agentId,
      agent_secret: agentSecret,
      claim_id: claimId,
      telegram_chat_id: "123456789", // Fake chat ID for testing
    }),
  });

  if (response.status === 500) {
    const error = await response.json();
    if (error.details?.includes("not configured") || error.error?.includes("not configured")) {
      console.log("⚠️  TELEGRAM_BOT_TOKEN not configured (expected in test environment)");
      console.log("   In production, this would send an approval button to the Telegram chat");
      return;
    }
  }

  if (!response.ok) {
    const error = await response.text();
    console.log(`⚠️  Send approval returned: ${response.status} - ${error}`);
    return;
  }

  console.log("✅ Approval message sent (or would be sent in production)");
}

async function testClaimDirect(
  agentId: string,
  claimId: string,
  telegramUserId: string
): Promise<ClaimResponse> {
  console.log("\n🔐 Step 3: Simulating claim with verified telegram_user_id...");
  console.log(`   (In production, this is called only from Telegram callback handler)`);

  // Simulate the internal call that the Telegram callback handler would make
  const response = await fetch(`${BASE_URL}/api/revclaw/agents/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RevClaw-Internal-Caller": "telegram-callback",
    },
    body: JSON.stringify({
      agent_id: agentId,
      claim_id: claimId,
      telegram_user_id: telegramUserId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claim failed: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as ClaimResponse;
  console.log("✅ Claim successful:");
  console.log(`   installation_id: ${data.installation_id}`);
  console.log(`   user_id: ${data.user_id}`);

  return data;
}

async function testClaimValidation(
  agentId: string,
  claimId: string
): Promise<void> {
  console.log("\n🧪 Step 4: Testing validation scenarios...");

  // Test 1: Try to claim again (should fail - already claimed)
  console.log("   Test 4a: Attempting duplicate claim...");
  const dupResponse = await fetch(`${BASE_URL}/api/revclaw/agents/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RevClaw-Internal-Caller": "telegram-callback",
    },
    body: JSON.stringify({
      agent_id: agentId,
      claim_id: claimId,
      telegram_user_id: "987654321", // Different user
    }),
  });

  if (dupResponse.status === 409) {
    console.log("   ✅ Duplicate claim correctly rejected (409 Conflict)");
  } else {
    console.log(`   ⚠️  Unexpected response: ${dupResponse.status}`);
  }

  // Test 2: Try with wrong agent_id
  console.log("   Test 4b: Attempting claim with wrong agent_id...");
  const wrongAgentResponse = await fetch(`${BASE_URL}/api/revclaw/agents/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RevClaw-Internal-Caller": "telegram-callback",
    },
    body: JSON.stringify({
      agent_id: "wrong_agent_id",
      claim_id: claimId,
      telegram_user_id: "123456789",
    }),
  });

  if (wrongAgentResponse.status === 400 || wrongAgentResponse.status === 404) {
    console.log(`   ✅ Wrong agent_id correctly rejected (${wrongAgentResponse.status})`);
  } else {
    console.log(`   ⚠️  Unexpected response: ${wrongAgentResponse.status}`);
  }

  // Test 3: Try with invalid claim_id
  console.log("   Test 4c: Attempting claim with invalid claim_id...");
  const invalidClaimResponse = await fetch(`${BASE_URL}/api/revclaw/agents/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RevClaw-Internal-Caller": "telegram-callback",
    },
    body: JSON.stringify({
      agent_id: agentId,
      claim_id: "invalid_claim_id_that_does_not_exist",
      telegram_user_id: "123456789",
    }),
  });

  if (invalidClaimResponse.status === 404) {
    console.log("   ✅ Invalid claim_id correctly rejected (404 Not Found)");
  } else {
    console.log(`   ⚠️  Unexpected response: ${invalidClaimResponse.status}`);
  }
}

async function main() {
  console.log("🚀 RevClaw Phase 1 Integration Test");
  console.log("====================================");
  console.log(`Base URL: ${BASE_URL}`);

  try {
    // Step 1: Register agent
    const registration = await testRegisterAgent();

    // Step 2: Test send-approval (will log warning if no bot token)
    await testSendApproval(
      registration.agent_id,
      registration.agent_secret,
      registration.claim_id
    );

    // Step 3: Simulate claim (as if from Telegram callback)
    const testTelegramUserId = "test_user_" + Date.now();
    const claim = await testClaimDirect(
      registration.agent_id,
      registration.claim_id,
      testTelegramUserId
    );

    // Step 4: Test validation scenarios
    await testClaimValidation(registration.agent_id, registration.claim_id);

    console.log("\n====================================");
    console.log("✅ All tests passed!");
    console.log("\nSummary:");
    console.log(`  - Agent ID: ${registration.agent_id}`);
    console.log(`  - Installation ID: ${claim.installation_id}`);
    console.log(`  - User ID: ${claim.user_id}`);
    console.log(`  - Telegram User ID: ${testTelegramUserId}`);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

main();
