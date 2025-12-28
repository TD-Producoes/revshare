import { NextResponse } from "next/server";

const DEFAULT_REDIRECT_URI = "http://localhost:3000/api/connect/oauth/callback";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") ?? "creator";
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "STRIPE_CONNECT_CLIENT_ID is required" },
      { status: 500 },
    );
  }

  const redirectUri =
    process.env.STRIPE_CONNECT_REDIRECT_URI ?? DEFAULT_REDIRECT_URI;

  const state = Buffer.from(
    JSON.stringify({ role, projectId }),
  ).toString("base64");
  const url = new URL("https://connect.stripe.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.json({ data: { url: url.toString() } });
}
