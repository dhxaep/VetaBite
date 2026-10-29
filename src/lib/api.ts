import { NextResponse } from "next/server";

// ---- Client fetch helper ----
export type ApiOk<T> = { success: true; data: T };
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
  const j = await r.json().catch(() => ({ success: false, error: { message: "Respons tidak valid" } }));
  if (!r.ok || j.success === false) throw new Error(j?.error?.message || "Terjadi kesalahan. Coba lagi.");
  return (j.data ?? j) as T;
}

// ---- Server response helpers ----
export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonErr(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export function zodMsg(err: { issues: { message: string }[] }): string {
  return err.issues?.[0]?.message || "Input tidak valid.";
}
