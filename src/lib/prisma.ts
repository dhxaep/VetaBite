import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Enable SQLite High-Performance Concurrency Settings:
  // 1. WAL mode: allows concurrent readers and writers without locking
  // 2. busy_timeout = 5000: waits up to 5s on concurrent writes instead of SQLITE_BUSY error
  // 3. synchronous = NORMAL: optimizes disk I/O without sacrificing data integrity
  // 4. cache_size = 10000: allocates ~40MB RAM cache for lightning-fast reads
  // 5. temp_store = MEMORY: stores temporary tables in RAM
  client
    .$queryRawUnsafe("PRAGMA journal_mode = WAL;")
    .then(() => client.$queryRawUnsafe("PRAGMA busy_timeout = 5000;"))
    .then(() => client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;"))
    .then(() => client.$queryRawUnsafe("PRAGMA cache_size = 10000;"))
    .then(() => client.$queryRawUnsafe("PRAGMA temp_store = MEMORY;"))
    .catch((err) => {
      console.warn("SQLite pragma optimization notice:", err?.message || err);
    });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;