import "server-only";
import type { Business } from "@prisma/client";
import { db } from "./db";
import { accessState } from "./platform";
import { countryName } from "./geo";

export type PinStatus = "active" | "lifetime" | "trial" | "lapsed" | "inactive";
export const PIN_STATUS: Record<PinStatus, { label: string; color: string }> = {
  active: { label: "Paying", color: "#4f9cf0" },
  lifetime: { label: "Lifetime", color: "#ffffff" },
  trial: { label: "On trial", color: "#f06fae" },
  lapsed: { label: "Trial over / expired", color: "#f2b84b" },
  inactive: { label: "Suspended / cancelled", color: "#8a929c" },
};

export function pinStatus(b: Pick<Business, "status" | "trialEndsAt" | "paidUntil" | "plan">): PinStatus {
  const s = accessState(b);
  if (s.reason === "active") return b.plan === "lifetime" ? "lifetime" : "active";
  if (s.reason === "trial") return "trial";
  if (s.reason === "suspended" || s.reason === "cancelled") return "inactive";
  return "lapsed";
}

/** 0 idle · 1 light · 2 steady · 3 busy, from bookings + sales recorded in the last 30 days. */
export const activityLevel = (n: number) => (n === 0 ? 0 : n < 15 ? 1 : n < 80 ? 2 : 3);
export const ACTIVITY_LABEL = ["Idle", "Light", "Steady", "Busy"];

// Spread pins that share a county centre so they don't sit on top of each other (stable per salon).
function jitter(id: string, source: string | null) {
  if (source !== "county" && source !== "country") return [0, 0];
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = source === "country" ? 0.9 : 0.12;
  return [((h % 1000) / 1000 - 0.5) * r, (((h >> 10) % 1000) / 1000 - 0.5) * r];
}

export async function mapData() {
  const since = new Date(Date.now() - 30 * 86400_000);
  const funnelSince = new Date(Date.now() - 90 * 86400_000);
  const [businesses, appts, sales, events] = await Promise.all([
    db.business.findMany({ where: { isShowcase: false }, select: { id: true, name: true, slug: true, status: true, plan: true, trialEndsAt: true, paidUntil: true, createdAt: true, country: true, region: true, city: true, latitude: true, longitude: true, locationSource: true, _count: { select: { users: true, clients: true } } } }),
    db.appointment.groupBy({ by: ["businessId"], where: { createdAt: { gte: since } }, _count: true }),
    db.sale.groupBy({ by: ["businessId"], where: { createdAt: { gte: since } }, _count: true }),
    db.signupEvent.findMany({ where: { createdAt: { gte: funnelSince } }, orderBy: { createdAt: "desc" }, take: 5000 }),
  ]);

  const pins = businesses.map((b) => {
    const activity = (appts.find((x) => x.businessId === b.id)?._count ?? 0) + (sales.find((x) => x.businessId === b.id)?._count ?? 0);
    const [dy, dx] = jitter(b.id, b.locationSource);
    return {
      id: b.id, name: b.name, slug: b.slug, status: pinStatus(b), plan: b.plan, activity, level: activityLevel(activity),
      place: [b.city, b.region, countryName(b.country)].filter(Boolean).join(", "),
      lat: b.latitude == null ? null : b.latitude + dy, lng: b.longitude == null ? null : b.longitude + dx,
      staff: b._count.users, clients: b._count.clients, since: b.createdAt.toISOString(),
    };
  });

  // Visitors who reached the sign-up page but never created an account, grouped by place.
  const converted = new Set(events.filter((e) => e.stage === "created").map((e) => e.visitorId));
  const groups = new Map<string, { lat: number; lng: number; place: string; visitors: Set<string>; attempts: number }>();
  for (const e of events) {
    if (converted.has(e.visitorId) || e.latitude == null || e.longitude == null) continue;
    const key = `${e.latitude.toFixed(1)},${e.longitude.toFixed(1)}`;
    const g = groups.get(key) ?? { lat: e.latitude, lng: e.longitude, place: [e.city, countryName(e.country)].filter(Boolean).join(", ") || "Unknown", visitors: new Set(), attempts: 0 };
    g.visitors.add(e.visitorId);
    if (e.stage === "attempt") g.attempts++;
    groups.set(key, g);
  }
  const visitors = [...groups.values()].map((g) => ({ lat: g.lat, lng: g.lng, place: g.place, visitors: g.visitors.size, attempts: g.attempts }));

  const uniq = (stage: string, days: number) => new Set(events.filter((e) => e.stage === stage && e.createdAt.getTime() > Date.now() - days * 86400_000).map((e) => e.visitorId)).size;
  const funnel = { visitors: uniq("visit", 30), attempted: uniq("attempt", 30), created: events.filter((e) => e.stage === "created" && e.createdAt > since).length };

  // Sign-ups that failed and never succeeded later: people worth a follow-up.
  const abandoned = events.filter((e) => e.stage === "attempt" && e.error && e.email && !converted.has(e.visitorId)).slice(0, 25)
    .map((e) => ({ id: e.id, at: e.createdAt.toISOString(), email: e.email!, businessName: e.businessName, error: e.error!, place: [e.city, countryName(e.country)].filter(Boolean).join(", ") }));

  const places = new Map<string, number>();
  for (const p of pins) places.set(p.place || "Unknown", (places.get(p.place || "Unknown") ?? 0) + 1);
  const topPlaces = [...places.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return { pins, visitors, funnel, abandoned, topPlaces };
}
