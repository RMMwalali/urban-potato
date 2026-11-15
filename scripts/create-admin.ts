// Create or update a platform admin. Credentials come from the environment, never from code:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' ADMIN_NAME='Your Name' npm run admin:create
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters).");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const name = process.env.ADMIN_NAME ?? "Platform admin";
  await db.platformAdmin.upsert({ where: { email }, update: { passwordHash, name }, create: { email, passwordHash, name } });
  console.log(`Platform admin ready: ${email}. Log in at /admin/login`);
}
main().finally(() => db.$disconnect());
