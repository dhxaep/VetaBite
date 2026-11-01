import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const isLocalhost = req.nextUrl.host.includes("localhost") || req.nextUrl.host.includes("127.0.0.1");
  const appUrl = isLocalhost
    ? `${req.nextUrl.protocol}//${req.nextUrl.host}`
    : (process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`);

  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId) {
    // If GOOGLE_CLIENT_ID is not yet set in .env, redirect back to login with informative query
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "oauth_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  // Google OAuth 2.0 Authorization Endpoint with hosted domain restriction
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  // hd = Hosted Domain: restricts Google account selection to @mahasiswa.upnvj.ac.id
  googleAuthUrl.searchParams.set("hd", "mahasiswa.upnvj.ac.id");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("access_type", "online");

  return NextResponse.redirect(googleAuthUrl.toString());
}
