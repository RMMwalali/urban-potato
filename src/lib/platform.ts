import "server-only";
import { cache } from "react";
import { db } from "./db";
import { decrypt } from "./crypto";
import type { Business } from "@prisma/client";

/* ---------- Platform settings ---------- */

export const SETTING_DEFAULTS = {
  general: {
    siteName: "Darling",
    supportEmail: "",
    supportPhone: "",
    supportWhatsApp: "",
    trialDays: 14,
    signupEnabled: true,
    monthlyPrice: 2500,
    currency: "KES",
  },
  seo: {
    defaultTitle: "Darling: booking engine and client management for salons and spas",
    titleTemplate: "%s · Darling",
    description: "You don't need a website, you need a booking engine. Online booking, client records, M-Pesa checkout and reminders for salons, barbershops and spas. Free 14-day trial.",
    keywords: "salon software, spa booking, salon booking app Kenya, M-Pesa salon POS, beauty parlour management",
    ogImage: "",
    twitterHandle: "",
    googleVerification: "",
    canonicalUrl: "",
  },
};
export type Settings = typeof SETTING_DEFAULTS;

export const getSettings = cache(async (): Promise<Settings> => {
  const out = structuredClone(SETTING_DEFAULTS) as Settings;
  // Fall back to defaults if the database is unreachable (e.g. static pages prerendered at build time).
  const rows = await db.platformSetting.findMany({ where: { key: { in: Object.keys(SETTING_DEFAULTS) } } }).catch((e) => {
    console.warn("getSettings: using defaults,", (e as Error).message.split("\n").pop());
    return [];
  });
  for (const r of rows) Object.assign(out[r.key as keyof Settings], r.value as object);
  return out;
});

/* ---------- API credentials (DB first, env fallback) ---------- */

export const PROVIDERS = {
  africastalking: { label: "Africa's Talking (SMS)", fields: ["AT_USERNAME", "AT_API_KEY", "AT_SENDER_ID"] },
  whatsapp: { label: "WhatsApp Cloud API", fields: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE_LANG"] },
  mpesa: { label: "M-Pesa Daraja", fields: ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_ENV"] },
  messaging: { label: "Messaging provider", fields: ["MESSAGE_PROVIDER"] },
} as const;

export async function getCredential(name: string): Promise<string | undefined> {
  const row = await db.apiCredential.findFirst({ where: { name } });
  if (row) {
    try {
      return decrypt(row.encValue);
    } catch {
      console.error(`Could not decrypt credential ${name}; check ENCRYPTION_KEY`);
    }
  }
  return process.env[name] || undefined;
}

/* ---------- Trial / subscription ---------- */

export function accessState(b: Pick<Business, "status" | "trialEndsAt" | "paidUntil">) {
  const now = Date.now();
  const daysLeft = Math.ceil((b.trialEndsAt.getTime() - now) / 86400_000);
  if (b.status === "SUSPENDED") return { ok: false, reason: "suspended" as const, daysLeft };
  if (b.status === "CANCELLED") return { ok: false, reason: "cancelled" as const, daysLeft };
  if (b.status === "ACTIVE") {
    if (b.paidUntil && b.paidUntil.getTime() < now) return { ok: false, reason: "expired" as const, daysLeft: 0 };
    return { ok: true, reason: "active" as const, daysLeft };
  }
  if (b.status === "PAST_DUE") return { ok: false, reason: "expired" as const, daysLeft: 0 };
  return daysLeft > 0 ? { ok: true, reason: "trial" as const, daysLeft } : { ok: false, reason: "trial_over" as const, daysLeft: 0 };
}
