// Build step for Vercel: resolves the database URL from whichever variable the
// Postgres integration created, runs migrations on a direct (non-pooled) connection,
// then builds Next.js.
import { spawnSync } from "node:child_process";

const pick = (...names) => names.map((n) => process.env[n]).find((v) => v && v.trim());

const pooled = pick("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING");
const direct = pick("DIRECT_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");

if (!pooled) {
  console.error(`
──────────────────────────────────────────────────────────────
  No database connection string found.

  Fix: in your Vercel project open Storage → connect a Postgres
  database (e.g. Neon) to this project for Production, Preview
  and Development, OR add an environment variable named
  DATABASE_URL with your Postgres URL. Then redeploy.
──────────────────────────────────────────────────────────────
`);
  process.exit(1);
}

const run = (cmd, args, env = {}) => {
  console.log(`\n▶ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run("npx", ["prisma", "generate"], { DATABASE_URL: pooled });
run("npx", ["prisma", "migrate", "deploy"], { DATABASE_URL: direct });
run("npx", ["next", "build"], { DATABASE_URL: pooled });
