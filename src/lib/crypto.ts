import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { encryptionSecret } from "./secrets";

// AES-256-GCM for secrets stored in the database (API credentials).
// Set ENCRYPTION_KEY in production; changing it makes stored credentials unreadable.
function key() {
  return createHash("sha256").update(encryptionSecret()).digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload: string) {
  const [iv, tag, enc] = payload.split(".").map((s) => Buffer.from(s, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
