import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { secretSource } from "@/lib/secrets";

export const dynamic = "force-dynamic";

// Deployment diagnostics. Reports presence (never values) of required settings, which database
// endpoint the app is using, and whether migrations have been applied.
export async function GET() {
  const len = (k: string) => (process.env[k] ?? "").length;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || "";
  const dbEndpoint = url.match(/@([^/:?]+)/)?.[1]?.split(".")[0] ?? null; // e.g. ep-xxx-pooler (no credentials)

  const out: Record<string, unknown> = {
    env: {
      DATABASE_URL: url ? "set" : "missing",
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED ? "set" : "missing (migrations fall back to DATABASE_URL)",
      AUTH_SECRET: secretSource("AUTH_SECRET"),
      ENCRYPTION_KEY: secretSource("ENCRYPTION_KEY"),
      CRON_SECRET: len("CRON_SECRET") ? "set" : "missing (reminder cron disabled until set)",
      ADMIN_SETUP_TOKEN: len("ADMIN_SETUP_TOKEN") ? "set" : "not set",
      APP_URL: process.env.APP_URL || `(default) ${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "localhost"}`,
    },
    dbEndpoint,
  };
  try {
    const t = await db.$queryRaw<{ n: bigint }[]>`select count(*) as n from information_schema.tables where table_schema = 'public'`;
    out.db = "connected";
    out.tables = Number(t[0].n);
    if (out.tables === 0) out.hint = "Database is empty: migrations have not run on this database. Redeploy so the build runs prisma migrate deploy.";
    else {
      const m = await db.$queryRaw<{ migration_name: string }[]>`select migration_name from _prisma_migrations where finished_at is not null order by finished_at`;
      out.migrations = m.map((r) => r.migration_name);
    }
  } catch (e) {
    out.db = "error";
    out.dbError = (e as Error).message.split("\n").filter(Boolean).pop()?.replace(/postgres(ql)?:\/\/[^@\s]+@/g, "postgresql://***@");
  }
  const problems = Object.entries(out.env as Record<string, string>).filter(([k, v]) => k === "DATABASE_URL" && v !== "set");
  try { out.platformAdmins = await db.platformAdmin.count(); } catch {}
  out.ok = out.db === "connected" && (out.tables as number) > 0 && problems.length === 0;
  return NextResponse.json(out, { status: out.ok ? 200 : 500 });
}
