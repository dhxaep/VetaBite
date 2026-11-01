import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/api";
import {
  getUserAuditLogs,
  addUserAuditLog,
  generatePasswordResetToken,
  getInitials,
} from "@/lib/admin-data";

export interface CivitasUser {
  id: string;
  name: string;
  identity: string;
  facultyOrStall: string;
  email: string;
  phone: string;
  role: "MAHASISWA" | "PENJUAL";
  roleLabel: string;
  status: "ACTIVE" | "BANNED";
  statusLabel: string;
  initials: string;
  registeredAt: string;
  ordersOrActivity: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role"); // "ALL", "MAHASISWA", "PENJUAL"
    const statusFilter = searchParams.get("status"); // "all", "active", "banned"
    const searchQuery = searchParams.get("search")?.toLowerCase().trim() || "";

    // Real live counts from Supabase database
    const [totalMahasiswa, totalPenjual, totalBanned] = await Promise.all([
      prisma.user.count({ where: { role: "MAHASISWA" } }),
      prisma.user.count({ where: { role: "PENJUAL" } }),
      prisma.user.count({ where: { role: { in: ["MAHASISWA", "PENJUAL"] }, status: "BANNED" } }),
    ]);

    const stats = {
      total: totalMahasiswa + totalPenjual,
      mahasiswa: totalMahasiswa,
      kantin: totalPenjual,
      banned: totalBanned,
    };

    // Build Prisma query condition
    const where: any = {
      role: { in: ["MAHASISWA", "PENJUAL"] },
    };

    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter;
    }

    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter.toUpperCase();
    }

    if (searchQuery) {
      where.OR = [
        { username: { contains: searchQuery, mode: "insensitive" } },
        { full_name: { contains: searchQuery, mode: "insensitive" } },
        { whatsapp: { contains: searchQuery, mode: "insensitive" } },
        { canteen: { name: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    // Fetch live users from Supabase
    const dbUsers = await prisma.user.findMany({
      where,
      include: {
        canteen: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Map database users to CivitasUser format
    const users: CivitasUser[] = dbUsers.map((u) => {
      const isSeller = u.role === "PENJUAL";
      const isBanned = u.status === "BANNED";
      const stallInfo = u.canteen?.name || (isSeller ? "Mitra Kantin Loket" : "UPN Veteran Jakarta");
      const phoneNum = u.whatsapp || "-";

      return {
        id: u.id,
        name: u.full_name || u.username,
        identity: isSeller ? `Loket ${u.canteen?.name || "Kantin"}` : `NIM/ID ${u.username}`,
        facultyOrStall: stallInfo,
        email: u.username.includes("@") ? u.username : `${u.username}@mahasiswa.upnvj.ac.id`,
        phone: phoneNum,
        role: isSeller ? "PENJUAL" : "MAHASISWA",
        roleLabel: isSeller ? "Ibu Kantin" : "Mahasiswa",
        status: isBanned ? "BANNED" : "ACTIVE",
        statusLabel: isBanned ? "Banned" : "Aktif",
        initials: getInitials(u.full_name || u.username),
        registeredAt: u.created_at
          ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(u.created_at)
          : "Baru",
        ordersOrActivity: isSeller ? `Loket: ${u.canteen?.name || "Mitra Kampus"}` : "Civitas Kampus UPNVJ",
      };
    });

    const auditLogs = getUserAuditLogs();

    return jsonOk({
      users,
      stats,
      auditLogs,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/users error:", err);
    return jsonErr("SERVER_ERROR", "Gagal memuat data pengguna civitas dari database Supabase.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, status, reason } = body;

    if (!userId || !status) {
      return jsonErr("VALIDATION_ERROR", "userId dan status wajib diisi.", 400);
    }

    const newStatus = status === "BANNED" ? "BANNED" : "ACTIVE";

    // Update real user directly in Supabase PostgreSQL
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return jsonErr("NOT_FOUND", "Pengguna tidak ditemukan di database Supabase.", 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: newStatus,
        reject_reason: newStatus === "BANNED" ? (reason || "Penangguhan akun oleh admin") : null,
      },
    });

    const isBanned = newStatus === "BANNED";
    addUserAuditLog(
      isBanned ? "Status diubah: Ditangguhkan (Banned)" : "Status diubah: Dipulihkan (Aktif)",
      `${updated.full_name} (${updated.username})`,
      isBanned
        ? `Alasan: ${reason || "Pelanggaran ketertiban pesanan kampus."}`
        : "Penangguhan akun dicabut oleh Administrator Kemahasiswaan.",
      "Oleh Admin Kemahasiswaan",
      isBanned ? "banned" : "verified"
    );

    return jsonOk({
      message: `Status pengguna ${updated.full_name} berhasil diubah menjadi ${newStatus} di database Supabase.`,
      status: newStatus,
      user: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/users error:", err);
    return jsonErr("SERVER_ERROR", "Gagal memperbarui status pengguna di database Supabase.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, userRole, phone } = body;

    if (!userId) {
      return jsonErr("VALIDATION_ERROR", "userId wajib disertakan.", 400);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return jsonErr("NOT_FOUND", "Pengguna tidak ditemukan di database Supabase.", 404);
    }

    if (dbUser.role === "MAHASISWA") {
      return jsonErr(
        "FORBIDDEN_SSO_USER",
        "Akun mahasiswa menggunakan Google SSO kampus (@mahasiswa.upnvj.ac.id / @upnvj.ac.id) dan tidak menggunakan kata sandi lokal. Fitur ubah kata sandi hanya tersedia untuk akun Mitra Ibu Kantin.",
        403
      );
    }

    const targetPhone = phone || dbUser.whatsapp || "+62 812-9844-1102";
    const targetName = dbUser.full_name || userName || dbUser.username;
    const token = generatePasswordResetToken(dbUser.id, targetName, userRole || dbUser.role, targetPhone);

    const host = req.headers.get("host") || "vetabite.upnvj.ac.id";
    const protocol = host.includes("localhost") ? "http" : "https";
    const resetUrl = `${protocol}://${host}/auth/reset-password?token=${token}`;

    const rawPhone = targetPhone.replace(/[^0-9]/g, "");
    const waText = `Halo ${targetName}, Administrator VetaBite UPNVJ telah membuatkan tautan pengaturan ulang kata sandi untuk akun Anda. Silakan klik tautan aman berikut untuk membuat password baru: ${resetUrl}`;
    const waUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(waText)}`;

    return jsonOk({
      token,
      resetUrl,
      waText,
      waUrl,
      phone: targetPhone,
      userName: targetName,
      expiresInMinutes: 15,
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/users reset token error:", err);
    return jsonErr("SERVER_ERROR", "Gagal membuat tautan reset password di Supabase.", 500);
  }
}
