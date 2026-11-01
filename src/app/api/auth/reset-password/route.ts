import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/api";
import { getResetTokenInfo, consumePasswordResetToken } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return jsonErr("VALIDATION_ERROR", "Token reset password tidak ditemukan.", 400);
  }

  const info = getResetTokenInfo(token);
  if (!info) {
    return jsonErr("EXPIRED_OR_INVALID", "Tautan reset password tidak valid atau sudah kadaluarsa (melebihi 15 menit).", 400);
  }

  if (info.userRole?.toLowerCase().includes("mahasiswa")) {
    return jsonErr("SSO_ACCOUNT", "Akun mahasiswa menggunakan Google SSO (@mahasiswa.upnvj.ac.id / @upnvj.ac.id) dan tidak menggunakan kata sandi lokal.", 403);
  }

  return jsonOk({
    isValid: true,
    userName: info.userName,
    userRole: info.userRole,
    phone: info.phone,
    expiresAt: info.expiresAt,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token) {
      return jsonErr("VALIDATION_ERROR", "Token reset password wajib disertakan.", 400);
    }

    const info = getResetTokenInfo(token);
    if (!info) {
      return jsonErr("EXPIRED_OR_INVALID", "Tautan reset password tidak valid atau sudah kadaluarsa.", 400);
    }

    if (info.userRole?.toLowerCase().includes("mahasiswa")) {
      return jsonErr("SSO_ACCOUNT", "Akun mahasiswa menggunakan Google SSO kampus dan tidak menggunakan kata sandi lokal.", 403);
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return jsonErr("VALIDATION_ERROR", "Kata sandi baru minimal 6 karakter.", 400);
    }

    const result = await consumePasswordResetToken(token, newPassword);
    if (!result.success) {
      return jsonErr("RESET_FAILED", result.message, 400);
    }

    return jsonOk({
      message: result.message,
    });
  } catch (err: unknown) {
    console.error("Reset password error:", err);
    return jsonErr("SERVER_ERROR", "Terjadi kesalahan saat memperbarui kata sandi.", 500);
  }
}
