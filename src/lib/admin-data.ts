import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "./prisma";
import { hashPassword } from "./auth";

export interface GoogleAdmin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  initials: string;
  status: "active" | "inactive";
  added_at: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  statusBadge: string;
  statusBadgeColor: "emerald" | "primary" | "warning";
  email: string;
  description: string;
}

export interface UserAuditLog {
  id: string;
  timestamp: string;
  title: string;
  targetUser: string;
  detail: string;
  meta: string;
  type: "banned" | "key" | "verified";
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  userName: string;
  userRole: string;
  phone: string;
  expiresAt: number;
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production");
const DATA_DIR = isServerless ? path.join("/tmp", "vetabite_data") : path.join(process.cwd(), "data");
const ADMINS_FILE = path.join(DATA_DIR, "google_admins.json");
const AUDIT_FILE = path.join(DATA_DIR, "admin_audit_logs.json");
const USER_AUDIT_FILE = path.join(DATA_DIR, "user_audit_logs.json");
const TOKENS_FILE = path.join(DATA_DIR, "reset_tokens.json");

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem in serverless, ignored safely
  }
}

const DEFAULT_ADMINS: GoogleAdmin[] = [
  {
    id: "adm-superadmin",
    email: "dhafagifari0412@gmail.com",
    full_name: "Dhafa Gifari",
    role: "Superadmin Utama",
    initials: "DG",
    status: "active",
    added_at: "01 Jan 2024",
  },
  {
    id: "adm-1",
    email: "hendra.wicaksono@gmail.com",
    full_name: "Dr. Ir. Hendra Wicaksono, M.T.",
    role: "Administrator",
    initials: "HW",
    status: "active",
    added_at: "01 Agu 2024",
  },
  {
    id: "adm-2",
    email: "dewi.anggraini@yahoo.com",
    full_name: "Dewi Anggraini, S.Kom.",
    role: "Administrator",
    initials: "DA",
    status: "active",
    added_at: "15 Sep 2024",
  },
  {
    id: "adm-3",
    email: "bagas.prasetyo@company.com",
    full_name: "Bagas Prasetyo, S.AP.",
    role: "Administrator",
    initials: "BP",
    status: "active",
    added_at: "10 Okt 2024",
  },
  {
    id: "adm-4",
    email: "nurul.hidayah@upnvj.ac.id",
    full_name: "Nurul Hidayah, S.E.",
    role: "Administrator",
    initials: "NH",
    status: "active",
    added_at: "02 Nov 2024",
  },
  {
    id: "adm-5",
    email: "admin.kemahasiswaan@upnvj.ac.id",
    full_name: "Admin Utama UPNVJ",
    role: "Administrator",
    initials: "AU",
    status: "active",
    added_at: "01 Jul 2024",
  },
];

const DEFAULT_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: "log-1",
    timestamp: "Hari ini, 09:42 WIB",
    statusBadge: "Login Berhasil",
    statusBadgeColor: "emerald",
    email: "hendra.wicaksono@gmail.com",
    description: "Otentikasi berhasil via Google OAuth SSO. IP: 103.111.201.14 (Jakarta Selatan).",
  },
  {
    id: "log-2",
    timestamp: "Kemarin, 14:15 WIB",
    statusBadge: "Admin Ditambahkan",
    statusBadgeColor: "primary",
    email: "bagas.prasetyo@company.com",
    description: "Penambahan akun baru dengan hak akses tunggal Administrator.",
  },
  {
    id: "log-3",
    timestamp: "02 Nov 2024, 11:04 WIB",
    statusBadge: "Admin Ditambahkan",
    statusBadgeColor: "emerald",
    email: "dewi.anggraini@yahoo.com",
    description: "Akun Google institusi/publik ditautkan langsung dengan peran Administrator.",
  },
];

const DEFAULT_USER_AUDIT_LOGS: UserAuditLog[] = [
  {
    id: "ual-1",
    timestamp: "10 menit yang lalu",
    title: "Status diubah: Ditangguhkan (Banned)",
    targetUser: "Kevin Pratama (NIM 2210512033)",
    detail: "Alasan: Pesanan fiktif berulang di Kantin Boulevard.",
    meta: "Oleh Admin Kemahasiswaan",
    type: "banned",
  },
  {
    id: "ual-2",
    timestamp: "42 menit yang lalu",
    title: "Tautan Reset Password Dikirim",
    targetUser: "Ibu Rini Suminar (Loket #04)",
    detail: "Dispatched via WhatsApp API (+62 813-8822-4419).",
    meta: "Token aktif 15 mnt",
    type: "key",
  },
  {
    id: "ual-3",
    timestamp: "2 jam yang lalu",
    title: "Verifikasi Akun Baru Berhasil",
    targetUser: "Dimas Arya Pratama",
    detail: "Sinkronisasi data SSO SIAD UPN Veteran Jakarta.",
    meta: "Otomatis Sistem",
    type: "verified",
  },
];

let memoryAdmins: GoogleAdmin[] = [...DEFAULT_ADMINS];
let memoryAuditLogs: AdminAuditLog[] = [...DEFAULT_AUDIT_LOGS];
let memoryUserAuditLogs: UserAuditLog[] = [...DEFAULT_USER_AUDIT_LOGS];
let memoryTokens: Record<string, PasswordResetToken> = {};

export function getInitials(name: string): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const SUPERADMIN_EMAIL = "dhafagifari0412@gmail.com";

export async function getGoogleAdmins(): Promise<GoogleAdmin[]> {
  try {
    const dbAdmins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { created_at: "asc" },
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    const list: GoogleAdmin[] = dbAdmins.map((u) => {
      const isSuper = (u.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) || (u.username.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase());
      const created = u.created_at || new Date();
      const dateFormatted = `${String(created.getDate()).padStart(2, "0")} ${months[created.getMonth()]} ${created.getFullYear()}`;

      return {
        id: u.id,
        email: u.email || u.username,
        full_name: u.full_name || (isSuper ? "Dhafa Gifari" : "Administrator"),
        role: isSuper ? "Superadmin Utama" : "Administrator",
        initials: getInitials(u.full_name || u.username),
        status: (u.status === "ACTIVE" ? "active" : "inactive") as "active" | "inactive",
        added_at: dateFormatted,
      };
    });

    // Ensure Superadmin exists in Supabase
    const hasSuper = list.some((a) => a.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase());
    if (!hasSuper) {
      const pwd = await hashPassword("AdminUPNVJ#2025!");
      let superUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: SUPERADMIN_EMAIL },
            { email: SUPERADMIN_EMAIL },
          ],
        },
      });

      if (superUser) {
        superUser = await prisma.user.update({
          where: { id: superUser.id },
          data: { role: "ADMIN", status: "ACTIVE", email: SUPERADMIN_EMAIL },
        });
      } else {
        superUser = await prisma.user.create({
          data: {
            username: SUPERADMIN_EMAIL,
            email: SUPERADMIN_EMAIL,
            full_name: "Dhafa Gifari",
            role: "ADMIN",
            status: "ACTIVE",
            password_hash: pwd,
          },
        });
      }

      list.unshift({
        id: superUser.id,
        email: superUser.email || superUser.username,
        full_name: superUser.full_name,
        role: "Superadmin Utama",
        initials: "DG",
        status: "active",
        added_at: "01 Jan 2024",
      });
    }

    // Sort Superadmin to top
    list.sort((a, b) => {
      if (a.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) return -1;
      if (b.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) return 1;
      return 0;
    });

    memoryAdmins = list;
    return list;
  } catch (err) {
    console.error("Failed to query admins from Supabase:", err);
    return memoryAdmins.length > 0 ? memoryAdmins : DEFAULT_ADMINS;
  }
}

export function saveGoogleAdmins(admins: GoogleAdmin[]) {
  try {
    ensureDir();
    const normalized = admins.map((a) => ({
      ...a,
      role: a.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ? "Superadmin Utama" : "Administrator",
    }));
    memoryAdmins = normalized;
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(normalized, null, 2));
  } catch {
    // Read-only filesystem in serverless, memoryAdmins handles runtime state
  }
}

export async function addGoogleAdmin(email: string, full_name: string): Promise<GoogleAdmin> {
  const lowerEmail = email.toLowerCase().trim();
  const isSuper = lowerEmail === SUPERADMIN_EMAIL.toLowerCase();
  const defaultHash = await hashPassword("AdminUPNVJ#2025!");

  // Persist directly to Supabase User table
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: lowerEmail },
        { email: lowerEmail },
      ],
    },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: lowerEmail,
        full_name: full_name.trim(),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: lowerEmail,
        username: lowerEmail,
        full_name: full_name.trim(),
        role: "ADMIN",
        status: "ACTIVE",
        password_hash: defaultHash,
      },
    });
  }

  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const dateFormatted = `${String(now.getDate()).padStart(2, "0")} ${months[now.getMonth()]} ${now.getFullYear()}`;

  try {
    addAdminAuditLog(
      "Admin Ditambahkan",
      "emerald",
      user.username,
      `Akun Google ditautkan di database Supabase dengan hak akses ${isSuper ? "Superadmin Utama" : "Administrator"}.`
    );
  } catch {
    // Audit log write failure ignored on serverless
  }

  const newAdmin: GoogleAdmin = {
    id: user.id,
    email: user.email || user.username,
    full_name: user.full_name,
    role: isSuper ? "Superadmin Utama" : "Administrator",
    initials: getInitials(user.full_name),
    status: "active",
    added_at: dateFormatted,
  };

  memoryAdmins = [newAdmin, ...memoryAdmins.filter((a) => a.email.toLowerCase() !== lowerEmail)];
  return newAdmin;
}

export interface RemoveAdminResult {
  success: boolean;
  isSuperadmin?: boolean;
  message: string;
}

export async function removeGoogleAdmin(idOrEmail: string): Promise<RemoveAdminResult> {
  const lower = idOrEmail.toLowerCase().trim();

  // Find user in Supabase
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: idOrEmail },
        { username: lower },
        { email: lower },
      ],
      role: "ADMIN",
    },
  });

  if (!user) {
    return {
      success: false,
      message: "Akun administrator tidak ditemukan di database Supabase.",
    };
  }

  if (
    user.username.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    (user.email && user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase())
  ) {
    return {
      success: false,
      isSuperadmin: true,
      message: `Superadmin utama (${SUPERADMIN_EMAIL}) dilindungi oleh sistem dan tidak dapat di-kick.`,
    };
  }

  // Delete admin directly in Supabase
  await prisma.user.delete({
    where: { id: user.id },
  });

  try {
    addAdminAuditLog(
      "Akses Dicabut",
      "warning",
      user.username,
      `Kewenangan admin Google OAuth telah dicabut dari database Supabase (Kick Admin).`
    );
  } catch {
    // Ignore serverless logging error
  }

  memoryAdmins = memoryAdmins.filter((a) => a.id !== user.id && a.email.toLowerCase() !== lower);

  return {
    success: true,
    message: `Administrator ${user.full_name} (${user.username}) berhasil di-kick dari database Supabase.`,
  };
}

export function getAdminAuditLogs(): AdminAuditLog[] {
  try {
    ensureDir();
    if (!fs.existsSync(AUDIT_FILE)) {
      try {
        fs.writeFileSync(AUDIT_FILE, JSON.stringify(DEFAULT_AUDIT_LOGS, null, 2));
      } catch {
        // serverless read-only ignored
      }
      return memoryAuditLogs;
    }
    const data = fs.readFileSync(AUDIT_FILE, "utf-8");
    const parsed = JSON.parse(data) as AdminAuditLog[];
    memoryAuditLogs = parsed;
    return parsed;
  } catch {
    return memoryAuditLogs;
  }
}

export function addAdminAuditLog(
  statusBadge: string,
  statusBadgeColor: "emerald" | "primary" | "warning",
  email: string,
  description: string
) {
  try {
    ensureDir();
    const logs = [...getAdminAuditLogs()];
    const now = new Date();
    const timeStr = `Hari ini, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      statusBadge,
      statusBadgeColor,
      email,
      description,
    });
    if (logs.length > 30) logs.pop();
    memoryAuditLogs = logs;
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2));
  } catch {
    // Ignore serverless fs write error
  }
}

export function getUserAuditLogs(): UserAuditLog[] {
  try {
    ensureDir();
    if (!fs.existsSync(USER_AUDIT_FILE)) {
      try {
        fs.writeFileSync(USER_AUDIT_FILE, JSON.stringify(DEFAULT_USER_AUDIT_LOGS, null, 2));
      } catch {
        // serverless read-only ignored
      }
      return memoryUserAuditLogs;
    }
    const data = fs.readFileSync(USER_AUDIT_FILE, "utf-8");
    const parsed = JSON.parse(data) as UserAuditLog[];
    memoryUserAuditLogs = parsed;
    return parsed;
  } catch {
    return memoryUserAuditLogs;
  }
}

export function addUserAuditLog(
  title: string,
  targetUser: string,
  detail: string,
  meta: string,
  type: "banned" | "key" | "verified"
) {
  try {
    ensureDir();
    const logs = [...getUserAuditLogs()];
    logs.unshift({
      id: `ual-${Date.now()}`,
      timestamp: "Baru saja",
      title,
      targetUser,
      detail,
      meta,
      type,
    });
    if (logs.length > 30) logs.pop();
    memoryUserAuditLogs = logs;
    fs.writeFileSync(USER_AUDIT_FILE, JSON.stringify(logs, null, 2));
  } catch {
    // Ignore serverless fs write error
  }
}

function getTokens(): Record<string, PasswordResetToken> {
  try {
    ensureDir();
    if (!fs.existsSync(TOKENS_FILE)) return memoryTokens;
    const parsed = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
    memoryTokens = parsed;
    return parsed;
  } catch {
    return memoryTokens;
  }
}

function saveTokens(tokens: Record<string, PasswordResetToken>) {
  memoryTokens = tokens;
  try {
    ensureDir();
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  } catch {
    // Ignore serverless fs write error
  }
}

export function generatePasswordResetToken(
  userId: string,
  userName: string,
  userRole: string,
  phone: string
): string {
  const token = `vtb_sec_${crypto.randomBytes(8).toString("hex")}`;
  const tokens = getTokens();
  tokens[token] = {
    token,
    userId,
    userName,
    userRole,
    phone,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  saveTokens(tokens);

  addUserAuditLog(
    "Tautan Reset Password Dibuat",
    `${userName} (${phone || "Tanpa WhatsApp"})`,
    `Tautan reset dibuat untuk dispatch via WhatsApp (+${phone?.replace(/[^0-9]/g, "")}).`,
    "Token aktif 15 mnt • Oleh Administrator",
    "key"
  );

  return token;
}

export function getResetTokenInfo(token: string): PasswordResetToken | null {
  const tokens = getTokens();
  const info = tokens[token];
  if (!info) return null;
  if (info.expiresAt < Date.now()) {
    delete tokens[token];
    saveTokens(tokens);
    return null;
  }
  return info;
}

export async function consumePasswordResetToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const tokens = getTokens();
  const info = tokens[token];
  if (!info) return { success: false, message: "Tautan reset password tidak valid atau sudah kadaluarsa." };
  if (info.expiresAt < Date.now()) {
    delete tokens[token];
    saveTokens(tokens);
    return { success: false, message: "Tautan reset password telah kadaluarsa (melebihi batas 15 menit)." };
  }

  const hash = await hashPassword(newPassword);
  try {
    let target = await prisma.user.findFirst({
      where: {
        OR: [
          { id: info.userId },
          { username: info.userId },
          { full_name: info.userName },
          { whatsapp: info.phone },
        ],
      },
    });

    if (target) {
      if (target.role === "MAHASISWA") {
        return {
          success: false,
          message: "Akun mahasiswa terhubung langsung dengan Google SSO kampus (@mahasiswa.upnvj.ac.id / @upnvj.ac.id) dan tidak menggunakan kata sandi lokal.",
        };
      }
      await prisma.user.update({
        where: { id: target.id },
        data: { password_hash: hash },
      });
    } else {
      const cleanPhone = info.phone.replace(/[^0-9]/g, "");
      const generatedUsername =
        info.userName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) ||
        `user_${cleanPhone.slice(-6)}`;
      await prisma.user.create({
        data: {
          username: generatedUsername,
          full_name: info.userName,
          password_hash: hash,
          role: info.userRole.toLowerCase().includes("kantin") ? "PENJUAL" : "MAHASISWA",
          status: "ACTIVE",
          whatsapp: info.phone,
        },
      });
    }
  } catch (dbErr) {
    console.error("Database user password update error:", dbErr);
  }

  delete tokens[token];
  saveTokens(tokens);

  addUserAuditLog(
    "Kata Sandi Berhasil Diperbarui",
    info.userName,
    `Pengguna berhasil memperbarui kata sandi menggunakan tautan reset resmi.`,
    "Otomatis Sistem",
    "verified"
  );

  return { success: true, message: "Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru." };
}
