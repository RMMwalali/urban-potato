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
