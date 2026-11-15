import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

// Neon on Vercel: node-postgres pool over the POOLED connection string (-pooler host),
// registered with Vercel Fluid compute so idle clients are released before an instance suspends.
// Migrations use the DIRECT string (DATABASE_URL_UNPOOLED); see scripts/vercel-build.mjs.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;

function createClient() {
  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 10_000 });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
