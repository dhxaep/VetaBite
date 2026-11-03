import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Di Cloudflare Workers, koneksi TCP tidak boleh dipakai lintas request,
// jadi client dibuat per request (disimpan per ExecutionContext).
const perRequest = new WeakMap<object, PrismaClient>();
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function requestKey(): object | null {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-context__")];
  return ctx?.ctx ?? null;
}

export function getPrisma(): PrismaClient {
  const key = requestKey();
  if (!key) return (globalForPrisma.prisma ??= createPrismaClient());
  let c = perRequest.get(key);
  if (!c) {
    c = createPrismaClient();
    perRequest.set(key, c);
  }
  return c;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const c = getPrisma() as any;
    const v = c[prop];
    return typeof v === "function" ? v.bind(c) : v;
  },
});

export default prisma;
