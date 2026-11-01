import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { jsonOk, jsonErr } from "@/lib/api";

function formatNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "";
  const cleaned = localPart.replace(/[0-9._-]/g, " ").trim();
  if (!cleaned) return "Mahasiswa UPNVJ";
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = (body.email as string)?.trim().toLowerCase() || "";
    const fullNameInput = (body.full_name as string)?.trim() || "";
    const avatarUrl = (body.avatar_url as string)?.trim() || null;
    const googleId = (body.google_id as string)?.trim() || null;
    const rememberMe = Boolean(body.remember_me);

    if (!rawEmail) {
      return jsonErr("EMAIL_REQUIRED", "Email akun Google wajib diisi.", 400);
    }

    // Strict Domain Enforcement: Only @mahasiswa.upnvj.ac.id allowed for Mahasiswa
    if (!rawEmail.endsWith("@mahasiswa.upnvj.ac.id")) {
      return jsonErr(
        "INVALID_DOMAIN",
        "Hanya akun Google resmi mahasiswa UPN Veteran Jakarta (@mahasiswa.upnvj.ac.id) yang dapat masuk sebagai Mahasiswa.",
        400
      );
    }

    const emailPrefix = rawEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
    const resolvedName = fullNameInput || formatNameFromEmail(rawEmail);

    // 1. Look up existing user in Supabase
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: rawEmail },
          ...(googleId ? [{ google_id: googleId }] : []),
          { username: emailPrefix },
        ],
      },
    });

    if (user) {
      // Check if user is banned or suspended
      if (user.status === "BANNED" || user.status === "INACTIVE" || user.status === "REJECTED") {
        return jsonErr(
          "ACCOUNT_SUSPENDED",
          "Akun Anda berstatus non-aktif atau ditangguhkan. Silakan hubungi Biro Kemahasiswaan UPNVJ.",
          403
        );
      }

      // Update OAuth information if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: rawEmail,
          google_id: googleId || user.google_id || `google_${Date.now()}`,
          avatar_url: avatarUrl || user.avatar_url,
          full_name: user.full_name || resolvedName,
          role: "MAHASISWA",
          status: "ACTIVE",
        },
      });
    } else {
      // 2. Auto-register new student in Supabase
      let uniqueUsername = emailPrefix;
      if (uniqueUsername.length < 3) {
        uniqueUsername = `mhs_${Date.now().toString().slice(-6)}`;
      }

      // Check if username is already taken by another user
      const existingUsername = await prisma.user.findUnique({
        where: { username: uniqueUsername },
      });

      if (existingUsername) {
        uniqueUsername = `${uniqueUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      user = await prisma.user.create({
        data: {
          email: rawEmail,
          username: uniqueUsername,
          full_name: resolvedName,
          avatar_url: avatarUrl,
          google_id: googleId || `google_${Date.now()}`,
          role: "MAHASISWA",
          status: "ACTIVE",
        },
      });
    }

    // 3. Create secure HTTP-only session cookie
    await createSession(user.id, rememberMe);

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      redirectTo: "/dashboard",
    });
  } catch (err: unknown) {
    console.error("Student Google OAuth Error:", err);
    return jsonErr("SERVER_ERROR", "Terjadi kegagalan saat memproses autentikasi Google Mahasiswa.", 500);
  }
}

export async function GET() {
  // Preset sample accounts for interactive fast-login in development and preview
  const demoAccounts = [
    {
      name: "Dimas Arya Pratama",
      email: "2110511001@mahasiswa.upnvj.ac.id",
      nim: "2110511001",
      faculty: "Fakultas Ilmu Komputer",
    },
    {
      name: "Gheffira Nurul",
      email: "2110511045@mahasiswa.upnvj.ac.id",
      nim: "2110511045",
      faculty: "Fakultas Ilmu Komputer",
    },
    {
      name: "Salma Putri Anindya",
      email: "2210611023@mahasiswa.upnvj.ac.id",
      nim: "2210611023",
      faculty: "Fakultas Ekonomi dan Bisnis",
    },
    {
      name: "Rizky Fauzan",
      email: "2010411088@mahasiswa.upnvj.ac.id",
      nim: "2010411088",
      faculty: "Fakultas Ilmu Sosial dan Ilmu Politik",
    },
  ];

  return jsonOk({
    allowedDomain: "@mahasiswa.upnvj.ac.id",
    demoAccounts,
  });
}
