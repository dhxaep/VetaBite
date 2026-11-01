import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  hd?: string;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    `${url.protocol}//${url.host}`;

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const loginUrl = new URL("/login", appUrl);

  if (error || !code) {
    loginUrl.searchParams.set("error", error || "access_denied");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "oauth_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Google Token Exchange Failed:", errBody);
      loginUrl.searchParams.set("error", "token_exchange_failed");
      return NextResponse.redirect(loginUrl);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated user profile from Google UserInfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("Google UserInfo Fetch Failed:", await userRes.text());
      loginUrl.searchParams.set("error", "userinfo_failed");
      return NextResponse.redirect(loginUrl);
    }

    const googleUser: GoogleUserInfo = await userRes.json();
    const email = googleUser.email?.trim().toLowerCase() || "";

    // 3. Domain Check: Must be @mahasiswa.upnvj.ac.id
    if (!email.endsWith("@mahasiswa.upnvj.ac.id")) {
      loginUrl.searchParams.set("error", "invalid_domain");
      return NextResponse.redirect(loginUrl);
    }

    // 4. Resolve or Auto-Register User in Supabase Database
    const emailPrefix = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
    const fullName = googleUser.name?.trim() || "Mahasiswa UPNVJ";

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { google_id: googleUser.sub },
          { username: emailPrefix },
        ],
      },
    });

    if (user) {
      // Check status
      if (user.status === "BANNED" || user.status === "INACTIVE" || user.status === "REJECTED") {
        loginUrl.searchParams.set("error", "account_suspended");
        return NextResponse.redirect(loginUrl);
      }

      // Update OAuth information
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          google_id: googleUser.sub,
          avatar_url: googleUser.picture || user.avatar_url,
          full_name: user.full_name || fullName,
          role: "MAHASISWA",
          status: "ACTIVE",
        },
      });
    } else {
      // Auto-create new user
      let uniqueUsername = emailPrefix;
      if (uniqueUsername.length < 3) {
        uniqueUsername = `mhs_${Date.now().toString().slice(-6)}`;
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username: uniqueUsername },
      });

      if (existingUsername) {
        uniqueUsername = `${uniqueUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      user = await prisma.user.create({
        data: {
          email,
          username: uniqueUsername,
          full_name: fullName,
          avatar_url: googleUser.picture || null,
          google_id: googleUser.sub,
          role: "MAHASISWA",
          status: "ACTIVE",
        },
      });
    }

    // 5. Create secure session cookie (30 days)
    await createSession(user.id, true);

    // 6. Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  } catch (err: unknown) {
    console.error("Google OAuth Callback Handler Error:", err);
    loginUrl.searchParams.set("error", "server_error");
    return NextResponse.redirect(loginUrl);
  }
}
