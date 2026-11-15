import "server-only";
import { db } from "./db";
import { getSettings } from "./platform";
import type { Business } from "@prisma/client";

/** Founding offer state: places are only used by salons that actually subscribe (activated), not trials. */
export async function foundingOffer() {
  const { general } = await getSettings();
  const used = await db.business.count({ where: { foundingMember: true } }).catch(() => 0);
  const slots = general.foundingSlots;
  const left = Math.max(0, slots - used);
  return {
    enabled: general.foundingOfferEnabled && left > 0,
    configuredOn: general.foundingOfferEnabled,
    slots, used, left,
    percent: general.foundingPercent,
    months: general.foundingMonths,
    fullPrice: general.monthlyPrice,
    offerPrice: Math.round(general.monthlyPrice * (1 - general.foundingPercent / 100)),
    currency: general.currency,
  };
}

/** What this salon pays per month right now. */
export async function monthlyPriceFor(b: Pick<Business, "discountPercent" | "discountUntil">) {
  const { general } = await getSettings();
  const active = b.discountPercent > 0 && b.discountUntil && b.discountUntil > new Date();
  return { price: active ? Math.round(general.monthlyPrice * (1 - b.discountPercent / 100)) : general.monthlyPrice, discounted: !!active, until: active ? b.discountUntil : null, percent: active ? b.discountPercent : 0 };
}

const addMonths = (d: Date, m: number) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };

/** Called when a salon becomes a paying subscriber. Grants the offer if places remain. */
export async function grantFoundingIfEligible(businessId: string) {
  const offer = await foundingOffer();
  const b = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  if (b.foundingMember || !offer.enabled) return false;
  await db.business.update({ where: { id: businessId }, data: { foundingMember: true, discountPercent: offer.percent, discountUntil: addMonths(new Date(), offer.months) } });
  return true;
}

export async function setFounding(businessId: string, on: boolean) {
  const { general } = await getSettings();
  await db.business.update({
    where: { id: businessId },
    data: on ? { foundingMember: true, discountPercent: general.foundingPercent, discountUntil: addMonths(new Date(), general.foundingMonths) } : { foundingMember: false, discountPercent: 0, discountUntil: null },
  });
}

/* ---------- Plans: monthly, annual, lifetime (one-time) ---------- */

export type PlanId = "monthly" | "annual" | "lifetime";
export const PLAN_LABEL: Record<PlanId, string> = { monthly: "Monthly", annual: "Annual", lifetime: "Lifetime" };
export const planOf = (b: Pick<Business, "plan">): PlanId => (b.plan === "annual" || b.plan === "lifetime" ? b.plan : "monthly");

export async function plans() {
  const { general } = await getSettings();
  const sold = await db.business.count({ where: { plan: "lifetime" } }).catch(() => 0);
  const left = Math.max(0, general.lifetimeLimit - sold);
  return {
    currency: general.currency,
    monthly: { price: general.monthlyPrice },
    annual: { price: general.annualPrice, perMonth: Math.round(general.annualPrice / 12), saving: Math.max(0, general.monthlyPrice * 12 - general.annualPrice) },
    lifetime: { price: general.lifetimePrice, enabled: general.lifetimeEnabled && left > 0, limit: general.lifetimeLimit, sold, left },
  };
}

/** What this salon pays on its current plan (founding discount applies to monthly and annual). */
export async function billingFor(b: Pick<Business, "plan" | "discountPercent" | "discountUntil">) {
  const { general } = await getSettings();
  const plan = planOf(b);
  const active = plan !== "lifetime" && b.discountPercent > 0 && !!b.discountUntil && b.discountUntil > new Date();
  const base = plan === "annual" ? general.annualPrice : plan === "lifetime" ? general.lifetimePrice : general.monthlyPrice;
  // Annual: the founding discount covers only the discounted months that fall within the year being paid.
  const monthsLeft = active ? Math.min(12, Math.ceil((b.discountUntil!.getTime() - Date.now()) / (30.44 * 86400_000))) : 0;
  const price = !active ? base : plan === "annual" ? Math.round(base - (base / 12) * monthsLeft * (b.discountPercent / 100)) : Math.round(base * (1 - b.discountPercent / 100));
  return { plan, label: PLAN_LABEL[plan], price, base, period: plan === "annual" ? "year" : plan === "lifetime" ? "once" : "month", discounted: active, until: active ? b.discountUntil : null, percent: active ? b.discountPercent : 0 };
}
