// PBKDF2 via Web Crypto (native, ringan untuk batas CPU Cloudflare Workers free plan).
// Format: pbkdf2$<iterasi>$<salt base64>$<hash base64>
const ITER = 10000;
const enc = new TextEncoder();

function toB64(u: Uint8Array) {
  let s = "";
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function derive(p: string, salt: Uint8Array<ArrayBuffer>, iter: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(p), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(p: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${toB64(salt)}$${toB64(await derive(p, salt, ITER))}`;
}

export async function verifyPassword(p: string, h: string) {
  if (h.startsWith("pbkdf2$")) {
    const [, iter, salt, hash] = h.split("$");
    const got = await derive(p, fromB64(salt), Number(iter));
    const want = fromB64(hash);
    if (got.length !== want.length) return false;
    let diff = 0;
    for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
    return diff === 0;
  }
  // Hash bcrypt lama (data sebelum migrasi ke Cloudflare)
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(p, h);
}
