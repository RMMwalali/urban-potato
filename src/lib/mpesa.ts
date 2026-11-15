import "server-only";
import { appUrl } from "@/lib/url";
import { db } from "./db";
import { decrypt } from "./crypto";
import type { Business, Prisma } from "@prisma/client";

const host = (env: string) => (env === "sandbox" ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke");

async function darajaToken(b: Business) {
  if (!b.darajaKeyEnc || !b.darajaSecretEnc) throw new Error("Add your Daraja consumer key and secret first");
  const auth = Buffer.from(`${decrypt(b.darajaKeyEnc)}:${decrypt(b.darajaSecretEnc)}`).toString("base64");
  const res = await fetch(`${host(b.darajaEnv)}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.access_token) throw new Error(`Daraja login failed (${res.status}). Check the key, secret and environment.`);
  return j.access_token as string;
}

/** Callback URLs. Safaricom rejects URLs containing words like "mpesa", so the path avoids them. */
export function c2bUrls(b: Pick<Business, "c2bToken">) {
  const base = appUrl();
  return { confirmation: `${base}/api/pay/c2b/${b.c2bToken}/confirm`, validation: `${base}/api/pay/c2b/${b.c2bToken}/validate` };
}

/** Ask Safaricom to send every payment to this till/paybill to our confirmation URL. */
export async function registerC2B(b: Business) {
  if (!b.darajaShortcode) throw new Error("Add your till or paybill shortcode first");
  const urls = c2bUrls(b);
  if (!urls.confirmation.startsWith("https://")) throw new Error("Your APP_URL must be a public https:// address for Safaricom to reach it");
  const token = await darajaToken(b);
  const res = await fetch(`${host(b.darajaEnv)}/mpesa/c2b/v2/registerurl`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ShortCode: b.darajaShortcode, ResponseType: "Completed", ConfirmationURL: urls.confirmation, ValidationURL: urls.validation }),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || (j?.ResponseCode && j.ResponseCode !== "0")) throw new Error(j?.errorMessage ?? j?.ResponseDescription ?? `Registration failed (${res.status})`);
  await db.business.update({ where: { id: b.id }, data: { c2bRegisteredAt: new Date() } });
}

/** Parse Daraja TransTime "20261115103145" (EAT) to a Date. */
function parseTransTime(t?: string) {
  if (!t || !/^\d{14}$/.test(t)) return null;
  return new Date(`${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(8, 10)}:${t.slice(10, 12)}:${t.slice(12, 14)}+03:00`);
}

type C2BPayload = { TransID?: string; TransAmount?: string | number; TransTime?: string; MSISDN?: string; BillRefNumber?: string; FirstName?: string; MiddleName?: string; LastName?: string; BusinessShortCode?: string };

/** Store a Safaricom-confirmed payment. Upgrades an earlier unverified record of the same code. */
export async function recordC2B(businessId: string, p: C2BPayload) {
  const code = String(p.TransID ?? "").toUpperCase();
  if (!/^[A-Z0-9]{8,12}$/.test(code)) throw new Error("bad TransID");
  const payerName = [p.FirstName, p.MiddleName, p.LastName].filter(Boolean).join(" ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || null;
  const data = {
    amount: Number(p.TransAmount ?? 0),
    payerName,
    phone: p.MSISDN ?? null,
    billRef: p.BillRefNumber ?? null,
    transTime: parseTransTime(p.TransTime),
    source: "C2B" as const,
    raw: p as Prisma.InputJsonValue,
  };
  const tx = await db.mpesaTransaction.upsert({
    where: { businessId_code: { businessId, code } },
    update: data,
    create: { ...data, businessId, code },
    include: { payment: true },
  });
  // A payment recorded before the callback arrived becomes verified now.
  if (tx.payment) await db.payment.update({ where: { id: tx.payment.id }, data: { verified: true, payerName: tx.payment.payerName ?? payerName } });
  if (tx.appointmentId) await db.appointment.update({ where: { id: tx.appointmentId }, data: { depositVerified: true } });
  return tx;
}

export type CodeLookup =
  | { status: "verified" | "unverified"; code: string; amount: number; payerName: string | null; when: string | null }
  | { status: "used"; code: string; usedOn: string }
  | { status: "not_found"; code: string };

export async function lookupCode(businessId: string, rawCode: string, tz: string): Promise<CodeLookup> {
  const code = rawCode.trim().toUpperCase();
  const tx = await db.mpesaTransaction.findUnique({ where: { businessId_code: { businessId, code } }, include: { payment: { include: { sale: { select: { number: true } } } } } });
  if (!tx) return { status: "not_found", code };
  if (tx.claimedAt) return { status: "used", code, usedOn: tx.payment ? `receipt #${tx.payment.sale.number}` : tx.usedFor === "DEPOSIT" ? "a booking deposit" : "another payment" };
  const when = tx.transTime ? new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(tx.transTime) : null;
  return { status: tx.source === "C2B" ? "verified" : "unverified", code, amount: Number(tx.amount), payerName: tx.payerName, when };
}
