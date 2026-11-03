import { NextResponse } from "next/server";

// ---- Client fetch helper ----
export type ApiOk<T> = { success: true; data: T };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  let j: any = null;
  try {
    j = await r.json();
  } catch {
    const errorMsg = !r.ok
      ? `Terjadi kesalahan pada server (HTTP ${r.status}). Silakan coba lagi.`
      : "Respons server tidak dapat diproses.";
    throw new Error(errorMsg);
  }

  if (!r.ok || j?.success === false) {
    const msg = j?.error?.message || `Terjadi kesalahan (HTTP ${r.status}).`;
    throw new Error(msg);
  }

  return (j?.data ?? j) as T;
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
