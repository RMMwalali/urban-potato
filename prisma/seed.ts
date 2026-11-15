import { PrismaClient, type AppointmentStatus, type BookingSource, type PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";

const db = new PrismaClient();
const rand = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

async function main() {
  await db.business.deleteMany({ where: { slug: "demo-salon" } });
  const tz = "Africa/Nairobi";
  const b = await db.business.create({
    data: { name: "Amani Beauty & Spa", slug: "demo-salon", phone: "0712 000 111", address: "Ngong Road, Nairobi", email: "hello@example.com", timezone: tz },
  });
  const pw = await bcrypt.hash("password123", 10);
  const staffData = [
    { name: "Wanjiru Kamau", email: "demo@spadesk.app", role: "OWNER", title: "Owner & stylist", commissionRate: 0, color: "#c084fc" },
    { name: "Achieng Otieno", email: "achieng@spadesk.app", role: "STAFF", title: "Braider", commissionRate: 30, color: "#f472b6" },
    { name: "Faith Mwangi", email: "faith@spadesk.app", role: "STAFF", title: "Nail technician", commissionRate: 25, color: "#60a5fa" },
    { name: "Brian Kiprop", email: "brian@spadesk.app", role: "MANAGER", title: "Massage therapist", commissionRate: 30, color: "#34d399" },
  ] as const;
  await db.user.deleteMany({ where: { email: { in: staffData.map((s) => s.email) } } });
  const staff = await Promise.all(staffData.map((s) => db.user.create({ data: { ...s, businessId: b.id, passwordHash: pw } })));

  const svc = [
    ["Wash & blow-dry", "Hair", 45, 800], ["Silk press", "Hair", 90, 2500], ["Knotless braids (medium)", "Hair", 300, 6000],
    ["Cornrows", "Hair", 120, 1500], ["Relaxer & style", "Hair", 120, 2800], ["Locs retwist", "Hair", 90, 2000],
    ["Gel manicure", "Nails", 60, 1500], ["Pedicure", "Nails", 60, 1800], ["Acrylic full set", "Nails", 90, 3000],
    ["Swedish massage (60 min)", "Spa", 60, 3500], ["Deep tissue massage", "Spa", 90, 5000], ["Classic facial", "Spa", 60, 3000],
    ["Eyebrow shaping", "Brows & lashes", 20, 500], ["Lash extensions", "Brows & lashes", 90, 3500],
  ] as const;
  const services = await Promise.all(svc.map(([name, category, durationMin, price]) => db.service.create({ data: { businessId: b.id, name, category, durationMin, price } })));
  for (const st of staff) {
    const t = st.title ?? "";
    const mine = services.filter((s) => (t.includes("stylist") || t === "Braider" ? s.category === "Hair" : t === "Nail technician" ? ["Nails", "Brows & lashes"].includes(s.category) : s.category === "Spa"));
    await db.user.update({ where: { id: st.id }, data: { services: { set: mine.map((s) => ({ id: s.id })) } } });
  }
  const staffFor = (cat: string) => (cat === "Hair" ? [staff[0], staff[1]] : cat === "Nails" || cat === "Brows & lashes" ? [staff[2]] : [staff[3]]);

  const first = ["Mercy", "Grace", "Njeri", "Akinyi", "Wambui", "Chebet", "Mwende", "Zawadi", "Nafula", "Atieno", "Kerubo", "Halima", "Joy", "Sharon", "Esther", "Lucy", "Kevin", "Dennis", "Amina", "Neema"];
  const last = ["Mutua", "Ochieng", "Wanjiku", "Kariuki", "Njoroge", "Omondi", "Kiplagat", "Wekesa", "Maina", "Hassan", "Mbugua", "Chege"];
  const clients = await Promise.all(
    Array.from({ length: 40 }, (_, i) =>
      db.client.create({
        data: {
          businessId: b.id,
          name: `${first[i % first.length]} ${last[(i * 7) % last.length]}`,
          phone: `2547${String(10000000 + i * 1234567).slice(0, 8)}`,
          allergies: i % 9 === 0 ? "Sensitive scalp: patch test relaxers" : i % 13 === 0 ? "Allergic to acrylic monomer" : null,
          preferences: i % 4 === 0 ? "Prefers Achieng, likes medium tension" : i % 5 === 0 ? "Firm pressure, lavender oil" : null,
          createdAt: DateTime.now().minus({ days: 30 + i }).toJSDate(),
        },
      }),
    ),
  );

  const sources: BookingSource[] = ["WALK_IN", "WALK_IN", "PHONE", "WHATSAPP", "WHATSAPP", "INSTAGRAM", "INSTAGRAM", "ONLINE", "ONLINE", "FACEBOOK", "TIKTOK"];
  const methods: PaymentMethod[] = ["MPESA", "MPESA", "MPESA", "CASH", "CASH", "CARD"];
  const today = DateTime.now().setZone(tz).startOf("day");
  let receipt = 0;
  for (let d = -30; d <= 7; d++) {
    const day = today.plus({ days: d });
    if (day.weekday === 7) continue;
    for (const st of staff) {
      let t = day.set({ hour: 8, minute: 30 + Math.floor(Math.random() * 3) * 15 });
      while (true) {
        const service = rand(services.filter((s) => staffFor(s.category).some((x) => x.id === st.id)));
        const end = t.plus({ minutes: service.durationMin });
        if (end.hour >= 19 || Math.random() < 0.12) break;
        const past = end < DateTime.now();
        const r = Math.random();
        const status: AppointmentStatus = past ? (r < 0.07 ? "NO_SHOW" : r < 0.1 ? "CANCELLED" : "COMPLETED") : r < 0.5 ? "CONFIRMED" : "BOOKED";
        const client = rand(clients);
        const a = await db.appointment.create({
          data: {
            businessId: b.id, clientId: client.id, staffId: st.id, serviceId: service.id,
            startAt: t.toJSDate(), endAt: end.toJSDate(), status, source: rand(sources), price: service.price,
            createdAt: t.minus({ days: Math.floor(Math.random() * 5) }).toJSDate(),
          },
        });
        if (status === "COMPLETED") {
          const price = Number(service.price);
          const tip = Math.random() < 0.2 ? 200 : 0;
          const method = rand(methods);
          await db.sale.create({
            data: {
              businessId: b.id, number: ++receipt, clientId: client.id, appointmentId: a.id,
              subtotal: price, tip, total: price + tip, method,
              reference: method === "MPESA" ? `S${Math.random().toString(36).slice(2, 11).toUpperCase()}` : null,
              createdAt: end.toJSDate(),
              items: { create: [{ serviceId: service.id, staffId: st.id, name: service.name, unitPrice: price, commission: (price * Number(st.commissionRate)) / 100 }] },
            },
          });
        }
        t = end.plus({ minutes: [0, 15, 30, 60][Math.floor(Math.random() * 4)] });
      }
    }
  }
  console.log(`Seeded "${b.name}". Log in with demo@spadesk.app / password123. Booking page: /book/demo-salon`);
}

main().finally(() => db.$disconnect());
