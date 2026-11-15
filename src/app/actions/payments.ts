"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { lookupCode, registerC2B, type CodeLookup } from "@/lib/mpesa";
import { parseMpesaSms } from "@/lib/mpesa-sms";

/** Checkout helper: look up an M-Pesa code and return payer name + amount if we have it. */
export async function lookupMpesa(code: string): Promise<CodeLookup> {
  const user = await requireUser();
  return lookupCode(user.businessId, code, user.business.timezone);
}

export type SmsState = { error?: string; ok?: string } | undefined;

/** Finance inbox: add a payment by pasting the M-Pesa SMS (for Pochi / personal numbers without C2B). */
export async function addFromSms(_: SmsState, fd: FormData): Promise<SmsState> {
  const user = await requireUser();
  const p = parseMpesaSms(String(fd.get("sms") ?? ""));
  if (!p) return { error: "Couldn't read that message. Paste the full M-Pesa confirmation SMS." };
  const exists = await db.mpesaTransaction.findUnique({ where: { businessId_code: { businessId: user.businessId, code: p.code } } });
  if (exists) return { error: `${p.code} is already recorded.` };
  await db.mpesaTransaction.create({
    data: { businessId: user.businessId, code: p.code, amount: p.amount, payerName: p.payerName, phone: p.phone, source: "SMS", raw: { sms: String(fd.get("sms")) } },
  });
  revalidatePath("/app/finance");
  return { ok: `Added ${p.code}: ${p.payerName ?? "unknown payer"}, KES ${p.amount.toLocaleString()}` };
}

export async function savePaymentSettings(fd: FormData) {
  const user = await requireUser(MANAGERS);
  const methods = ["CASH", "MPESA", "CARD", "BANK"].filter((m) => fd.get(`pm_${m}`) === "on");
  const key = String(fd.get("darajaKey") ?? "").trim();
  const secret = String(fd.get("darajaSecret") ?? "").trim();
  await db.business.update({
    where: { id: user.businessId },
    data: {
      paymentMethods: methods.length ? methods : ["CASH"],
      requireVerifiedMpesa: fd.get("requireVerifiedMpesa") === "on",
      darajaShortcode: String(fd.get("darajaShortcode") ?? "").trim() || null,
      darajaEnv: fd.get("darajaEnv") === "sandbox" ? "sandbox" : "production",
      ...(key ? { darajaKeyEnc: encrypt(key) } : {}),
      ...(secret ? { darajaSecretEnc: encrypt(secret) } : {}),
    },
  });
  revalidatePath("/app/settings");
}

export async function connectC2B(_s?: SmsState, _fd?: FormData): Promise<SmsState> {
  const user = await requireUser(MANAGERS);
  try {
    await registerC2B(user.business);
    revalidatePath("/app/settings");
    return { ok: "Connected. Payments to your till/paybill will now appear automatically." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
