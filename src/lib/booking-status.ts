import "server-only";
import type { Business } from "@prisma/client";
import { db } from "./db";
import { accessState } from "./platform";

export type Blocker = { reason: string; fix: string; href: string };

/** Why a salon's public booking page isn't taking bookings (empty list = it is). */
export async function bookingBlockers(b: Business): Promise<Blocker[]> {
  const [services, onlineServices, staff] = await Promise.all([
    db.service.count({ where: { businessId: b.id, active: true } }),
    db.service.count({ where: { businessId: b.id, active: true, onlineBooking: true } }),
    db.user.count({ where: { businessId: b.id, active: true, bookable: true } }),
  ]);
  const out: Blocker[] = [];
  if (!b.bookingEnabled) out.push({ reason: "Online booking is switched off.", fix: "Tick “Accept online bookings” and save", href: "/app/settings" });
  if (services === 0) out.push({ reason: "You haven't added any services yet.", fix: "Add your services and prices", href: "/app/services" });
  else if (onlineServices === 0) out.push({ reason: "None of your services are marked as bookable online.", fix: "Tick the Online box next to each service and save", href: "/app/services" });
  if (staff === 0) out.push({ reason: "Nobody on your team is set to take appointments.", fix: "Edit a team member (or yourself) and tick “Takes appointments”", href: "/app/staff" });
  const s = accessState(b);
  if (!s.ok) out.push({ reason: s.reason === "trial_over" ? "Your free trial has ended." : "Your subscription isn't active.", fix: "Renew your plan", href: "/app/billing" });
  if (b.openDays.length === 0) out.push({ reason: "No open days are set, so there are no times to offer.", fix: "Choose your open days", href: "/app/settings" });
  return out;
}
