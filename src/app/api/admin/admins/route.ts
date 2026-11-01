import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/api";
import {
  getGoogleAdmins,
  addGoogleAdmin,
  removeGoogleAdmin,
  getAdminAuditLogs,
} from "@/lib/admin-data";

export async function GET() {
  try {
    const admins = await getGoogleAdmins();
    const auditLogs = getAdminAuditLogs();

    const stats = {
      total: admins.length,
      ssoStatus: "100%",
      domainCoverage: "Bebas",
    };

    return jsonOk({
      admins,
      stats,
      auditLogs,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/admins error:", err);
    return jsonErr("SERVER_ERROR", "Gagal memuat data administrator Google dari Supabase.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, full_name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return jsonErr("VALIDATION_ERROR", "Email Akun Google tidak valid.", 400);
    }

    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 3) {
      return jsonErr("VALIDATION_ERROR", "Nama lengkap staf / pejabat minimal 3 karakter.", 400);
    }

    const newAdmin = await addGoogleAdmin(email.trim(), full_name.trim());

    return jsonOk({
      message: `Administrator Google ${email} berhasil ditambahkan ke database Supabase.`,
      admin: newAdmin,
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/admins error:", err);
    return jsonErr("SERVER_ERROR", "Gagal menambahkan administrator Google baru ke Supabase.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    const target = id || email;
    if (!target) {
      return jsonErr("VALIDATION_ERROR", "ID atau Email administrator wajib disertakan.", 400);
    }

    const result = await removeGoogleAdmin(target);
    if (!result.success) {
      if (result.isSuperadmin) {
        return jsonErr("FORBIDDEN", result.message, 403);
      }
      return jsonErr("NOT_FOUND", result.message, 404);
    }

    return jsonOk({
      message: result.message,
    });
  } catch (err: unknown) {
    console.error("DELETE /api/admin/admins error:", err);
    return jsonErr("SERVER_ERROR", "Gagal mencabut hak akses administrator (Kick).", 500);
  }
}
