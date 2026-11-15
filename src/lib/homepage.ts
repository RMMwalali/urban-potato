import "server-only";
import { db } from "./db";
import { getSettings, accessState } from "./platform";
import { mediaUrl } from "./media";
import { num } from "./format";

/**
 * What the landing page shows, from real salons only: those that agreed to be featured
 * (Settings → Logo & sharing) and that the platform admin picked (Admin → Homepage).
 */
export async function homepageData() {
  const { general } = await getSettings();
  const base = { featureConsent: true, isShowcase: false };
  const [svcSalons, logoSalons] = await Promise.all([
    general.homeServicesEnabled ? db.business.findMany({ where: { ...base, homeServices: true, bookingEnabled: true }, select: { id: true, name: true, slug: true, city: true, currency: true, status: true, trialEndsAt: true, paidUntil: true } }).catch(() => []) : [],
    general.homeLogosEnabled ? db.business.findMany({ where: { ...base, homeLogo: true, logoId: { not: null } }, select: { id: true, name: true, slug: true, logoId: true, status: true, trialEndsAt: true, paidUntil: true } }).catch(() => []) : [],
  ]);
  const live = svcSalons.filter((s) => accessState(s).ok);
  const services = live.length
    ? await db.service.findMany({
        where: { businessId: { in: live.map((s) => s.id) }, active: true, onlineBooking: true, media: { some: { styleId: null } } },
        select: { id: true, name: true, price: true, businessId: true, media: { where: { styleId: null }, orderBy: { position: "asc" }, take: 1, select: { id: true, alt: true, mime: true } } },
        orderBy: { createdAt: "desc" }, take: 60,
      })
    : [];
  // interleave salons so one salon doesn't fill the whole carousel
  const bySalon = live.map((s) => services.filter((x) => x.businessId === s.id).slice(0, 6));
  const cards: { id: string; name: string; price: string; salon: string; city: string | null; href: string; img: string; alt: string }[] = [];
  for (let i = 0; i < 6; i++)
    for (const [k, list] of bySalon.entries()) {
      const s = list[i];
      if (!s) continue;
      const salon = live[k];
      cards.push({ id: s.id, name: s.name, price: `${salon.currency} ${num(s.price).toLocaleString()}`, salon: salon.name, city: salon.city, href: `/book/${salon.slug}?service=${s.id}`, img: mediaUrl(s.media[0], "thumb"), alt: s.media[0].alt });
    }
  const logoMedia = logoSalons.length ? await db.media.findMany({ where: { id: { in: logoSalons.map((s) => s.logoId!) } }, select: { id: true, alt: true, mime: true } }) : [];
  const logos = logoSalons
    .filter((s) => accessState(s).ok)
    .map((s) => ({ id: s.id, name: s.name, href: `/book/${s.slug}`, img: logoMedia.find((m) => m.id === s.logoId) }))
    .filter((l) => l.img)
    .map((l) => ({ ...l, img: mediaUrl(l.img!, "thumb") }));
  return { cards: cards.slice(0, 24), logos };
}
