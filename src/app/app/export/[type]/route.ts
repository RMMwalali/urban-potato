import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, MANAGERS } from "@/lib/auth";
import { fmtDateTime, num } from "@/lib/format";

// CSV export: your data is yours. /app/export/clients | appointments | sales
const csv = (rows: (string | number | null | undefined)[][]) =>
  "﻿" + rows.map((r) => r.map((v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\n");

export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const s = await getSession();
  if (!s || !MANAGERS.includes(s.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await db.business.findUniqueOrThrow({ where: { id: s.businessId } });
  const tz = b.timezone;
  let body: string;
  if (type === "clients") {
    const rows = await db.client.findMany({ where: { businessId: b.id }, orderBy: { name: "asc" }, include: { _count: { select: { appointments: true } } } });
    body = csv([["Name", "Phone", "Email", "Birthday", "Allergies", "Preferences", "Notes", "Marketing OK", "Bookings", "Client since"],
      ...rows.map((c) => [c.name, `+${c.phone}`, c.email, c.birthday?.toISOString().slice(0, 10), c.allergies, c.preferences, c.notes, c.marketingOk ? "yes" : "no", c._count.appointments, c.createdAt.toISOString().slice(0, 10)])]);
  } else if (type === "appointments") {
    const rows = await db.appointment.findMany({ where: { businessId: b.id }, orderBy: { startAt: "desc" }, include: { client: true, service: true, staff: true } });
    body = csv([["Start", "Client", "Phone", "Service", "Staff", "Status", "Source", "Price", "Deposit", "Deposit ref", "Notes"],
      ...rows.map((a) => [fmtDateTime(a.startAt, tz), a.client.name, `+${a.client.phone}`, a.service.name, a.staff?.name, a.status, a.source, num(a.price), num(a.depositAmount), a.depositRef, a.notes])]);
  } else if (type === "sales") {
    const rows = await db.sale.findMany({ where: { businessId: b.id }, orderBy: { createdAt: "desc" }, include: { client: true, items: { include: { staff: true } }, payments: true } });
    body = csv([["Receipt", "Date", "Client", "Items", "Subtotal", "Discount", "Tip", "Deposit applied", "Total", "Payments", "M-Pesa verified"],
      ...rows.map((x) => [x.number, fmtDateTime(x.createdAt, tz), x.client?.name, x.items.map((i) => `${i.name}${i.staff ? ` (${i.staff.name})` : ""}`).join("; "), num(x.subtotal), num(x.discount), num(x.tip), num(x.depositApplied), num(x.total), x.payments.map((p) => `${p.method} ${num(p.amount)}${p.reference ? ` ${p.reference}` : ""}${p.payerName ? ` (${p.payerName})` : ""}`).join("; "), x.payments.filter((p) => p.method === "MPESA").every((p) => p.verified) ? "yes" : "no"])]);
  } else return NextResponse.json({ error: "unknown export" }, { status: 404 });
  return new NextResponse(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${b.slug}-${type}-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
