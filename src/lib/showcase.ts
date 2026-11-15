import "server-only";
import { randomBytes } from "crypto";
import { DateTime } from "luxon";
import type { AppointmentStatus, BookingSource, PaymentMethod, Service, User } from "@prisma/client";
import { db } from "./db";
import { hashPassword } from "./auth";

/**
 * The showcase salon is a clearly fictional account that the platform admin creates on purpose to film
 * reels with real screens. It never sends messages, and it's left out of admin stats, the customer map,
 * the sitemap and search engines. Delete it from the reel studio at any time.
 */

const TZ = "Africa/Nairobi";
export const SHOWCASE_MPESA_CODE = "TKF7Q2ZP4M"; // an unclaimed Safaricom-confirmed payment, used by the checkout reel
export const SHOWCASE_MPESA_PAYER = "JANE WAMBUI";

const STAFF = [
  { name: "Wanjiru Njeri", title: "Senior stylist", color: "#d9468a", rate: 35, cats: ["Hair", "Braids & locs"] },
  { name: "Brian Otieno", title: "Barber", color: "#1f5277", rate: 30, cats: ["Barbering"] },
  { name: "Achieng Atieno", title: "Nail technician", color: "#4f9cf0", rate: 30, cats: ["Nails"] },
  { name: "Mercy Chebet", title: "Therapist", color: "#8a5cf6", rate: 30, cats: ["Skin & spa"] },
];
const SERVICES = [
  { name: "Box braids", category: "Braids & locs", durationMin: 180, price: 3500, description: "Mid-back, hair included" },
  { name: "Locs retwist", category: "Braids & locs", durationMin: 120, price: 2500 },
  { name: "Silk press", category: "Hair", durationMin: 90, price: 2000 },
  { name: "Wash & blow-dry", category: "Hair", durationMin: 45, price: 1000 },
  { name: "Haircut & beard", category: "Barbering", durationMin: 45, price: 800 },
  { name: "Kids' haircut", category: "Barbering", durationMin: 30, price: 500 },
  { name: "Gel manicure", category: "Nails", durationMin: 60, price: 1200 },
  { name: "Spa pedicure", category: "Nails", durationMin: 60, price: 1500 },
  { name: "Deep-cleansing facial", category: "Skin & spa", durationMin: 60, price: 2500 },
  { name: "Full-body massage", category: "Skin & spa", durationMin: 90, price: 3500 },
];
const CLIENTS: { name: string; allergies?: string; preferences?: string; notes?: string }[] = [
  { name: "Jane Wambui", allergies: "Sensitive scalp. No relaxers.", preferences: "Prefers Wanjiru. Knotless, waist length.", notes: "Birthday in March. Likes a Saturday morning slot." },
  { name: "Faith Muthoni", preferences: "Silk press every 3 weeks" },
  { name: "Kevin Kiprop", preferences: "Low fade, sharp line-up" },
  { name: "Grace Akinyi", allergies: "Latex", preferences: "Almond nails, nude shades" },
  { name: "Sharon Wairimu", preferences: "Facial with extractions" },
  { name: "Dennis Mwangi", preferences: "Beard trim only" },
  { name: "Lucy Nyambura", notes: "Brings her daughter for kids' cuts" },
  { name: "Esther Moraa", preferences: "Locs retwist, no wax" },
  { name: "Ian Kamau" },
  { name: "Mary Wanjiku", allergies: "Lavender oil", preferences: "Firm pressure massage" },
  { name: "Joy Adhiambo", preferences: "Gel manicure, short square" },
  { name: "Collins Odhiambo" },
  { name: "Purity Jepchirchir", preferences: "Blow-dry before events" },
  { name: "Naomi Wangari", preferences: "Box braids, shoulder length" },
];
const SOURCES: BookingSource[] = ["ONLINE", "ONLINE", "INSTAGRAM", "WHATSAPP", "WALK_IN", "TIKTOK", "PHONE"];

export async function findShowcase() {
  return db.business.findFirst({ where: { isShowcase: true }, include: { users: { where: { role: "OWNER" }, take: 1 } } });
}

export async function deleteShowcase() {
  await db.business.deleteMany({ where: { isShowcase: true } });
}

export async function createShowcase() {
  await deleteShowcase();
  const suffix = randomBytes(2).toString("hex");
  const pw = await hashPassword(randomBytes(24).toString("base64url")); // nobody logs in with a password
  const now = DateTime.now().setZone(TZ);

  const b = await db.business.create({
    data: {
      name: "Amani Hair & Beauty", slug: `amani-hair-beauty-${suffix}`, isShowcase: true,
      phone: "+254 700 000 100", address: "Ngong Road, 2nd floor", city: "Kilimani", region: "Nairobi", country: "KE",
      status: "ACTIVE", plan: "monthly", trialEndsAt: now.plus({ days: 14 }).toJSDate(), paidUntil: null, onboardingDone: true,
      mpesaType: "TILL", mpesaNumber: "5123456", messageChannel: "WHATSAPP", openDays: [1, 2, 3, 4, 5, 6, 7], openTime: "08:00", closeTime: "19:00",
      cancelPolicyHours: 12, cancelPolicyText: "Free rescheduling up to 12 hours before your appointment.",
    },
  });
  const owner = await db.user.create({
    data: { businessId: b.id, name: "Amani Owner", email: `showcase-${suffix}@showcase.invalid`, passwordHash: pw, role: "OWNER", title: "Owner", bookable: false, color: "#1c1f24", tourDoneAt: new Date() },
  });
  const services: Service[] = [];
  for (const s of SERVICES) services.push(await db.service.create({ data: { businessId: b.id, ...s } }));
  const staff: User[] = [];
  for (const [i, s] of STAFF.entries()) {
    staff.push(await db.user.create({
      data: {
        businessId: b.id, name: s.name, title: s.title, color: s.color, commissionRate: s.rate, email: `showcase-${suffix}-${i}@showcase.invalid`, passwordHash: pw,
        role: "STAFF", tourDoneAt: new Date(), payType: i === 0 ? "BASE_PLUS_COMMISSION" : "COMMISSION", baseSalary: i === 0 ? 15000 : 0, payoutPhone: `25470000020${i}`,
        services: { connect: services.filter((x) => s.cats.includes(x.category)).map((x) => ({ id: x.id })) },
      },
    }));
  }
  const clients = [];
  for (const [i, c] of CLIENTS.entries()) clients.push(await db.client.create({ data: { businessId: b.id, phone: `2547000001${String(i).padStart(2, "0")}`, ...c } }));

  const staffFor = (svc: Service) => staff[STAFF.findIndex((s) => s.cats.includes(svc.category))];
  let receipt = 0;
  let k = 0;
  // Three weeks of history plus the coming week, five to seven visits a day.
  for (let d = -20; d <= 6; d++) {
    const day = now.plus({ days: d }).startOf("day");
    const perDay = 5 + ((d + 21) % 3);
    const used = new Map<string, number>(); // staffId -> next free minute
    for (let n = 0; n < perDay; n++, k++) {
      const svc = services[(((k * 7 + d * 3) % services.length) + services.length) % services.length];
      const st = staffFor(svc);
      const client = clients[(k * 5 + 3) % clients.length];
      const startMin = Math.max(used.get(st.id) ?? 9 * 60, 9 * 60 + ((k * 37) % 4) * 30);
      if (startMin + svc.durationMin > 18 * 60 + 30) continue;
      used.set(st.id, startMin + svc.durationMin + 15);
      const startAt = day.plus({ minutes: startMin });
      const past = startAt < now.minus({ hours: 1 });
      const status: AppointmentStatus = past ? (k % 17 === 0 ? "NO_SHOW" : k % 19 === 0 ? "CANCELLED" : "COMPLETED") : d === 0 && startAt < now.plus({ hours: 1 }) ? "ARRIVED" : k % 3 === 0 ? "CONFIRMED" : "BOOKED";
      const price = Number(svc.price);
      const appt = await db.appointment.create({
        data: { businessId: b.id, clientId: client.id, staffId: st.id, serviceId: svc.id, startAt: startAt.toJSDate(), endAt: startAt.plus({ minutes: svc.durationMin }).toJSDate(), status, source: SOURCES[k % SOURCES.length], price, createdAt: DateTime.min(startAt.minus({ days: 3 }), DateTime.fromJSDate(b.createdAt).minus({ minutes: 1 })).toJSDate(), reminderSentAt: past || d <= 1 ? startAt.minus({ hours: 24 }).toJSDate() : null },
      });
      if (appt.reminderSentAt && d >= -6) {
        await db.messageLog.create({ data: { businessId: b.id, clientId: client.id, appointmentId: appt.id, channel: "WHATSAPP", to: client.phone, kind: "REMINDER", status: "SENT", providerRef: "showcase", createdAt: appt.reminderSentAt, body: `Hi ${client.name.split(" ")[0]}, a reminder of your ${svc.name} with ${st.name.split(" ")[0]} at Amani Hair & Beauty on ${startAt.toFormat("ccc d LLL 'at' HH:mm")}. Reschedule or cancel: /b/${appt.manageToken}` } });
      }
      if (status !== "COMPLETED") continue;
      const tip = k % 4 === 0 ? 200 : 0;
      const method: PaymentMethod = k % 3 === 0 ? "CASH" : "MPESA";
      const code = `T${(k * 7919 + 1000003).toString(36).toUpperCase().padStart(9, "K").slice(-9)}`;
      const when = startAt.plus({ minutes: svc.durationMin }).toJSDate();
      const sale = await db.sale.create({
        data: {
          businessId: b.id, number: ++receipt, clientId: client.id, appointmentId: appt.id, subtotal: price, tip, tipStaffId: tip ? st.id : null, total: price + tip, method, reference: method === "MPESA" ? code : null, createdById: owner.id, createdAt: when,
          items: { create: [{ serviceId: svc.id, staffId: st.id, name: svc.name, unitPrice: price, commission: Math.round(price * Number(STAFF[staff.indexOf(st)].rate)) / 100 }] },
        },
      });
      if (method === "MPESA") {
        const tx = await db.mpesaTransaction.create({ data: { businessId: b.id, code, amount: price + tip, payerName: client.name.toUpperCase(), source: "C2B", transTime: when, usedFor: "SALE", claimedAt: when, createdAt: when } });
        await db.payment.create({ data: { saleId: sale.id, method, amount: price + tip, reference: code, payerName: client.name.toUpperCase(), verified: true, mpesaTxId: tx.id, createdAt: when } });
      } else {
        await db.payment.create({ data: { saleId: sale.id, method, amount: price + tip, tendered: Math.ceil((price + tip) / 1000) * 1000, createdAt: when } });
      }
    }
  }
  // A Safaricom-confirmed payment waiting at the till, for the checkout reel to look up.
  await db.mpesaTransaction.create({ data: { businessId: b.id, code: SHOWCASE_MPESA_CODE, amount: 3500, payerName: SHOWCASE_MPESA_PAYER, phone: "2547******101", source: "C2B", transTime: now.minus({ minutes: 4 }).toJSDate() } });
  await db.staffAdvance.create({ data: { businessId: b.id, userId: staff[1].id, amount: 2000, date: now.minus({ days: 6 }).toJSDate(), note: "School fees" } });
  return { business: b, owner };
}
