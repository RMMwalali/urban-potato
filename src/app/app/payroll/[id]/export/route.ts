import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, MANAGERS } from "@/lib/auth";
import { num } from "@/lib/format";
import { PAY_TYPE_LABEL } from "@/lib/payroll";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !MANAGERS.includes(s.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const run = await db.payRun.findFirst({ where: { id, businessId: s.businessId }, include: { payslips: { include: { user: true } } } });
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  const esc = (v: unknown) => { const x = v == null ? "" : String(v); return /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
  const head = ["Name", "Pay type", "Services", "Service revenue", "Base", "Commission", "Bonus", "Gross", "Statutory", "Statutory detail", "Advances", "Other deductions", "Chair rent", "Tips", "Net", "Paid", "Method", "Reference", "Payout phone"];
  const rows = run.payslips.map((p) => [
    p.user.name, PAY_TYPE_LABEL[p.payType], p.services, num(p.serviceRevenue), num(p.base), num(p.commission), num(p.bonus), num(p.gross), num(p.statutory),
    ((p.statutoryLines as { name: string; amount: number }[] | null) ?? []).map((l) => `${l.name} ${l.amount}`).join("; "),
    num(p.advances), num(p.otherDeductions), num(p.chairRent), num(p.tips), num(p.net), p.paidAt ? p.paidAt.toISOString().slice(0, 10) : "", p.paidMethod ?? "", p.paidRef ?? "", p.user.payoutPhone ? `+${p.user.payoutPhone}` : "",
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="payroll-${run.periodStart.toISOString().slice(0, 10)}.csv"` } });
}
