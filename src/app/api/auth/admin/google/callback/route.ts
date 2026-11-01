import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession, newSession } from "@/lib/auth";
import { getGoogleAdmins, addGoogleAdmin, addAdminAuditLog, type GoogleAdmin } from "@/lib/admin-data";

interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const isLocalhost = url.host.includes("localhost") || url.host.includes("127.0.0.1");
  const appUrl = isLocalhost
    ? `${url.protocol}//${url.host}`
    : (process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`);

  const redirectUri = `${appUrl}/api/auth/admin/google/callback`;
  const loginUrl = new URL("/admin/login", appUrl);

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
      console.error("Admin Google Token Exchange Failed:", await tokenRes.text());
      loginUrl.searchParams.set("error", "token_exchange_failed");
      return NextResponse.redirect(loginUrl);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated profile from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("Admin Google UserInfo Fetch Failed:", await userRes.text());
      loginUrl.searchParams.set("error", "userinfo_failed");
      return NextResponse.redirect(loginUrl);
    }

    const googleUser: GoogleUserInfo = await userRes.json();
    const email = googleUser.email?.trim().toLowerCase() || "";

    if (!email) {
      loginUrl.searchParams.set("error", "email_not_provided");
      return NextResponse.redirect(loginUrl);
    }

    // 3. Admin Domain Freedom: Any domain is accepted!
    // Check if admin is registered in allowed list, or auto-register them
    const allowedAdmins = await getGoogleAdmins();
    let matchingAdmin: GoogleAdmin | undefined = allowedAdmins.find(
      (a) => a.email.toLowerCase() === email
    );

    const formattedName =
      googleUser.name?.trim() ||
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    if (!matchingAdmin) {
      // Auto-register as Administrator
      matchingAdmin = await addGoogleAdmin(email, formattedName);
    }

    // 4. Ensure User exists in Supabase DB with role ADMIN
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email },
          { google_id: googleUser.sub },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: email,
          full_name: formattedName,
          google_id: googleUser.sub,
          avatar_url: googleUser.picture || null,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
    } else if (user.role !== "ADMIN" || !user.google_id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "ADMIN",
          status: "ACTIVE",
          email,
          google_id: googleUser.sub,
          avatar_url: googleUser.picture || user.avatar_url,
        },
      });
    }

    // 5. Establish secure session
    await setSession(newSession(user.id, "ADMIN", "ACTIVE", 30 * 24 * 3600 * 1000));

    // 6. Record Audit Log
    addAdminAuditLog(
      "Login Berhasil",
      "emerald",
      email,
      `Otentikasi berhasil via Google OAuth SSO Asli (${email}). Bebas Domain.`
    );

    return NextResponse.redirect(new URL("/admin/admins", appUrl));
  } catch (err: unknown) {
    console.error("Admin Google OAuth Callback Error:", err);
    loginUrl.searchParams.set("error", "server_error");
    return NextResponse.redirect(loginUrl);
  }
}
