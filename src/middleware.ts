import { NextResponse, type NextRequest } from "next/server";

const SELLER_ROUTES = ["/seller"];
const ADMIN_ROUTES = ["/admin"];
const MHS_ROUTES = ["/dashboard", "/kantin", "/keranjang", "/pesanan", "/riwayat", "/profil", "/search"];

function decodeSession(token: string | null | undefined): { uid?: string; role?: string; exp?: number } | null {
  if (!token) return null;
  const part = token.split(".")[0];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr);
  } catch {
    try {
      return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    } catch {
      return null;
    }
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Special case: /admin/login is the dedicated Google OAuth portal for administrators
  if (pathname === "/admin/login") {
    const token = req.cookies.get("vb_session")?.value;
    const session = decodeSession(token);
    if (session && session.role === "ADMIN" && (session.exp ?? 0) >= Date.now()) {
      return NextResponse.redirect(new URL("/admin/admins", req.url));
    }
    return NextResponse.next();
  }

  const isSeller = SELLER_ROUTES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_ROUTES.some((p) => pathname.startsWith(p));
  const isMhs = MHS_ROUTES.some((p) => pathname.startsWith(p));

  // If not a protected route or preview mode, continue
  if ((!isSeller && !isAdmin && !isMhs) || req.nextUrl.searchParams.get("preview") === "1") {
    return NextResponse.next();
  }

  const token = req.cookies.get("vb_session")?.value;
  const session = decodeSession(token);

  // If unauthenticated or expired session, redirect to appropriate login portal
  if (!session || (session.exp ?? 0) < Date.now()) {
    const loginTarget = isAdmin ? "/admin/login" : "/login";
    const loginUrl = new URL(loginTarget, req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.role;

  // Strict RBAC route guards
  if (isSeller && role !== "PENJUAL") {
    // Non-sellers attempting to access /seller/* are redirected to their home dashboard
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin/admins" : "/dashboard", req.url));
  }

  if (isAdmin && role !== "ADMIN") {
    // Non-admins attempting to access /admin/* are redirected
    return NextResponse.redirect(new URL(role === "PENJUAL" ? "/seller/pesanan" : "/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|uploads).*)"],
};
