"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";

export type FormState = { error?: string } | undefined;

const SignupSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name"),
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { businessName, name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) return { error: "An account with this email already exists" };

  const base = slugify(businessName) || "salon";
  let slug = base;
  for (let i = 2; await db.business.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  const user = await db.$transaction(async (tx) => {
    const business = await tx.business.create({ data: { name: businessName, slug, email } });
    await tx.service.createMany({
      data: [
        { businessId: business.id, name: "Haircut & blow-dry", category: "Hair", durationMin: 60, price: 1500 },
        { businessId: business.id, name: "Manicure", category: "Nails", durationMin: 45, price: 1000 },
        { businessId: business.id, name: "Full body massage", category: "Spa", durationMin: 60, price: 3500 },
      ],
    });
    return tx.user.create({
      data: { businessId: business.id, name, email, passwordHash: await hashPassword(password), role: "OWNER", title: "Owner" },
    });
  });

  await createSession({ userId: user.id, businessId: user.businessId, role: user.role });
  redirect("/app?welcome=1");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash)))
    return { error: "Incorrect email or password" };
  await createSession({ userId: user.id, businessId: user.businessId, role: user.role });
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
