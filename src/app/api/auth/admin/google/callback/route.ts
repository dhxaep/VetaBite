import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const isLocalhost = url.host.includes("localhost") || url.host.includes("127.0.0.1");
  const appUrl = isLocalhost
    ? `${url.protocol}//${url.host}`
    : (process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`);

  const target = new URL("/api/auth/google/callback", appUrl);
  url.searchParams.forEach((val, key) => {
    target.searchParams.set(key, val);
  });
  if (!target.searchParams.get("state")) {
    target.searchParams.set("state", "admin");
  }

  return NextResponse.redirect(target);
}
