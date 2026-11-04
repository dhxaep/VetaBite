import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SqlDriverAdapter, SqlDriverAdapterFactory } from "@prisma/driver-adapter-utils";

type CloudflareRequest = { ctx: object; env: { HYPERDRIVE?: { connectionString: string } } };

// Membuat PrismaClient mahal (ratusan ms CPU), jadi client dipakai bersama antar request.
// Koneksi TCP tidak boleh dipakai lintas request di Cloudflare Workers,
// jadi hanya koneksinya yang dibuat per request (disimpan per ExecutionContext).
const perRequest = new WeakMap<object, Promise<SqlDriverAdapter>>();
let localConnection: Promise<SqlDriverAdapter> | undefined;

function connect(connectionString: string | undefined) {
  return new PrismaPg({ connectionString, max: 1 }).connect();
}

function connection(): Promise<SqlDriverAdapter> {
  const req = (globalThis as Record<symbol, unknown>)[Symbol.for("__cloudflare-context__")] as CloudflareRequest | undefined;
  if (!req) return (localConnection ??= connect(process.env.DATABASE_URL));
  let c = perRequest.get(req.ctx);
  if (!c) {
    c = connect(req.env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL);
    perRequest.set(req.ctx, c);
  }
  return c;
}

const requestScopedAdapter: SqlDriverAdapterFactory = {
  provider: "postgres",
  adapterName: "@prisma/adapter-pg",
  connect: async () => ({
    provider: "postgres",
    adapterName: "@prisma/adapter-pg",
    queryRaw: async (query) => (await connection()).queryRaw(query),
    executeRaw: async (query) => (await connection()).executeRaw(query),
    executeScript: async (script) => (await connection()).executeScript(script),
    startTransaction: async (isolationLevel) => (await connection()).startTransaction(isolationLevel),
    getConnectionInfo: () => ({ supportsRelationJoins: true }),
    dispose: async () => {},
  }),
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: requestScopedAdapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
