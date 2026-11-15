import { DateTime } from "luxon";
import type { Prisma } from "@prisma/client";

type Num = number | string | Prisma.Decimal | null | undefined;
export const num = (v: Num) => (v == null ? 0 : Number(v.toString()));

export function money(v: Num, currency = "KES") {
  return `${currency} ${num(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const inTz = (d: Date, tz: string) => DateTime.fromJSDate(d).setZone(tz);
export const fmtTime = (d: Date, tz: string) => inTz(d, tz).toFormat("HH:mm");
export const fmtDate = (d: Date, tz: string) => inTz(d, tz).toFormat("ccc d LLL yyyy");
export const fmtDateTime = (d: Date, tz: string) => inTz(d, tz).toFormat("ccc d LLL, HH:mm");

/** Start and end (UTC Dates) of a local calendar day in the business timezone. */
export function dayRange(isoDate: string, tz: string) {
  const start = DateTime.fromISO(isoDate, { zone: tz }).startOf("day");
  return { start: start.toJSDate(), end: start.plus({ days: 1 }).toJSDate(), dt: start };
}

export const todayIso = (tz: string) => DateTime.now().setZone(tz).toISODate()!;

/** Normalise "0712 345 678", "+254712345678", "712345678" -> "254712345678". */
export function normalizePhone(raw: string, countryCode = "254") {
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  else if (p.startsWith("00")) p = p.slice(2);
  else if (p.startsWith("0")) p = countryCode + p.slice(1);
  else if (!p.startsWith(countryCode) && p.length <= 10) p = countryCode + p;
  return p;
}

export const displayPhone = (p: string) => (p ? `+${p}` : "");

export const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Booked",
  CONFIRMED: "Confirmed",
  ARRIVED: "Arrived",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

export const STATUS_STYLE: Record<string, string> = {
  BOOKED: "bg-sky-100 text-sky-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  ARRIVED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-600",
  NO_SHOW: "bg-rose-100 text-rose-800",
};

export const SOURCE_LABEL: Record<string, string> = {
  WALK_IN: "Walk-in",
  PHONE: "Phone call",
  ONLINE: "Online booking",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  OTHER: "Other",
};

export const METHOD_LABEL: Record<string, string> = {
  SPLIT: "Split",
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
  BANK: "Bank transfer",
  OTHER: "Other",
};

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40);
}
