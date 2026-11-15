import "server-only";
import { createHash } from "crypto";

// Secrets for sessions and at-rest encryption. Prefer explicit env vars; if they're missing (a common
// first-deploy slip), derive a stable, unguessable secret from the private database connection string so
// sign-up still works. The fallback changes if the database password changes, which logs everyone out,
// so production should set AUTH_SECRET and ENCRYPTION_KEY.
const warned = new Set<string>();
function derived(purpose: string, envName: string) {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!dbUrl) throw new Error(`${envName} must be set (32+ chars)`);
  if (!warned.has(envName)) {
    warned.add(envName);
    console.warn(`${envName} is not set; using a secret derived from DATABASE_URL. Set ${envName} in your environment.`);
  }
  return createHash("sha256").update(`darling:${purpose}:${dbUrl}`).digest("hex");
}

export function authSecret() {
  const s = process.env.AUTH_SECRET;
  return s && s.length >= 32 ? s : derived("auth", "AUTH_SECRET");
}

export function encryptionSecret() {
  return process.env.ENCRYPTION_KEY || (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 ? process.env.AUTH_SECRET : derived("enc", "ENCRYPTION_KEY"));
}

export const secretSource = (name: "AUTH_SECRET" | "ENCRYPTION_KEY") => {
  const v = process.env[name] ?? "";
  if (v.length >= 32 || (name === "ENCRYPTION_KEY" && v)) return "ok";
  return v ? "too short (using fallback)" : "missing (using fallback derived from DATABASE_URL; please set it)";
};
