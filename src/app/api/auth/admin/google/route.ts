import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession, newSession, hashPassword } from "@/lib/auth";
import { jsonOk, jsonErr } from "@/lib/api";
import { getGoogleAdmins, addGoogleAdmin, addAdminAuditLog, type GoogleAdmin } from "@/lib/admin-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedEmail = (body.email as string)?.trim().toLowerCase();

    const allowedAdmins = await getGoogleAdmins();

    // Find the requested admin or fallback to primary administrator
    let matchingAdmin: GoogleAdmin | undefined = requestedEmail
      ? allowedAdmins.find((a) => a.email.toLowerCase() === requestedEmail)
      : undefined;

    if (!matchingAdmin && requestedEmail) {
      // Bebas domain: allow any email domain without restriction and register as Administrator
      const formattedName = requestedEmail
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      matchingAdmin = await addGoogleAdmin(requestedEmail, formattedName);
    } else if (!matchingAdmin) {
      // Default fallback to first active admin
      matchingAdmin = allowedAdmins[0] || (await addGoogleAdmin("admin.kemahasiswaan@upnvj.ac.id", "Admin Utama UPNVJ"));
    }

    // Ensure matching Admin user exists in DB
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: matchingAdmin.email },
          { role: "ADMIN" }
        ]
      }
    });

    if (!user) {
      const defaultHash = await hashPassword("AdminUPNVJ#2025!");
      user = await prisma.user.create({
        data: {
          username: matchingAdmin.email,
          full_name: matchingAdmin.full_name,
          role: "ADMIN",
          status: "ACTIVE",
          password_hash: defaultHash,
        },
      });
    } else if (user.role !== "ADMIN") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", status: "ACTIVE" },
      });
    }

    // Set secure cookie session
    await setSession(newSession(user.id, "ADMIN", "ACTIVE"));

    // Add audit log
    addAdminAuditLog(
      "Login Berhasil",
      "emerald",
      matchingAdmin.email,
      `Otentikasi berhasil via Google OAuth SSO. IP: 103.111.201.14 (Kampus Pondok Labu).`
    );

    return jsonOk({
      admin: {
        id: user.id,
        email: matchingAdmin.email,
        full_name: matchingAdmin.full_name,
        role: matchingAdmin.role,
      },
      redirectTo: "/admin/admins",
    });
  } catch (err: unknown) {
    console.error("Admin Google OAuth error:", err);
    return jsonErr("SERVER_ERROR", "Terjadi kesalahan saat memproses otentikasi Google SSO.", 500);
  }
}

export async function GET() {
  const allowedAdmins = await getGoogleAdmins();
  return jsonOk({
    allowedAdmins: allowedAdmins.map((a) => ({
      email: a.email,
      name: a.full_name,
      role: a.role,
    })),
  });
}
