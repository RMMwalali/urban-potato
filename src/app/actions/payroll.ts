"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";
import type { Prisma, PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { computeSlip, KENYA_TEMPLATE, parseConfig, periodFactor, type PayrollConfig, type Rule } from "@/lib/payroll";

const n = (v: unknown) => Number(v ?? 0) || 0;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export type PayState = { error?: string; ok?: string } | undefined;

async function manager() {
  return requireUser(MANAGERS);
}

/** (Re)compute every payslip in a draft run from recorded sales, tips and advances. Keeps manual bonus/deductions/base. */
async function buildSlips(runId: string) {
  const run = await db.payRun.findUniqueOrThrow({ where: { id: runId }, include: { business: true, payslips: true } });
  if (run.status !== "DRAFT") return;
  const cfg = parseConfig(run.business.payrollConfig);
  const { f } = periodFactor(run.periodStart, run.periodEnd);
  const range = { gte: run.periodStart, lt: run.periodEnd };
  const staff = await db.user.findMany({ where: { businessId: run.businessId, active: true } });

  const [items, tips, advances] = await Promise.all([
    db.saleItem.groupBy({ by: ["staffId"], where: { staffId: { not: null }, sale: { businessId: run.businessId, createdAt: range } }, _sum: { commission: true, unitPrice: true }, _count: true }),
    db.sale.groupBy({ by: ["tipStaffId"], where: { businessId: run.businessId, tipStaffId: { not: null }, createdAt: range }, _sum: { tip: true } }),
    db.staffAdvance.groupBy({ by: ["userId"], where: { businessId: run.businessId, date: { lt: run.periodEnd }, OR: [{ payslipId: null }, { payslip: { payRunId: run.id } }] }, _sum: { amount: true } }),
  ]);
  // revenue needs quantity, so fetch per staff precisely
  const revenueRows = await db.saleItem.findMany({ where: { staffId: { not: null }, sale: { businessId: run.businessId, createdAt: range } }, select: { staffId: true, unitPrice: true, quantity: true } });

  for (const u of staff) {
    const existing = run.payslips.find((p) => p.userId === u.id);
    const it = items.find((x) => x.staffId === u.id);
    const revenue = revenueRows.filter((r) => r.staffId === u.id).reduce((t, r) => t + n(r.unitPrice) * r.quantity, 0);
    const slip = computeSlip(
      {
        payType: u.payType,
        baseSalary: n(u.baseSalary),
        chairRent: n(u.chairRent),
        statutory: u.statutory,
        commission: n(it?._sum.commission),
        tips: n(tips.find((x) => x.tipStaffId === u.id)?._sum.tip),
        advances: n(advances.find((x) => x.userId === u.id)?._sum.amount),
        bonus: n(existing?.bonus),
        otherDeductions: n(existing?.otherDeductions),
        baseOverride: existing ? n(existing.base) : null,
      },
      cfg,
      f,
    );
    const data = {
      payType: u.payType,
      base: slip.base, commission: slip.commission, bonus: slip.bonus, gross: slip.gross, tips: slip.tips,
      statutory: slip.statutory, statutoryLines: slip.statutoryLines as Prisma.InputJsonValue,
      advances: slip.advances, otherDeductions: slip.otherDeductions, chairRent: slip.chairRent, net: slip.net,
      services: it?._count ?? 0, serviceRevenue: revenue,
    };
    if (existing) await db.payslip.update({ where: { id: existing.id }, data });
    else await db.payslip.create({ data: { ...data, payRunId: run.id, userId: u.id } });
  }
}

async function ownRun(id: string) {
  const user = await manager();
  const run = await db.payRun.findFirst({ where: { id, businessId: user.businessId } });
  if (!run) throw new Error("Pay run not found");
  return { user, run };
}

export async function createPayRun(_: PayState, fd: FormData): Promise<PayState> {
  const user = await manager();
  const tz = user.business.timezone;
  const start = DateTime.fromISO(str(fd, "start"), { zone: tz }).startOf("day");
  const endIncl = DateTime.fromISO(str(fd, "end"), { zone: tz }).startOf("day");
  if (!start.isValid || !endIncl.isValid || endIncl < start) return { error: "Choose a valid period" };
  const run = await db.payRun.create({
    data: { businessId: user.businessId, periodStart: start.toJSDate(), periodEnd: endIncl.plus({ days: 1 }).toJSDate(), createdById: user.id, note: str(fd, "note") || null },
  });
  await buildSlips(run.id);
  redirect(`/app/payroll/${run.id}`);
}

export async function recalcPayRun(id: string) {
  const { run } = await ownRun(id);
  await buildSlips(run.id);
  revalidatePath(`/app/payroll/${id}`);
}

export async function updateSlip(fd: FormData) {
  const user = await manager();
  const slip = await db.payslip.findFirst({ where: { id: str(fd, "slipId"), payRun: { businessId: user.businessId, status: "DRAFT" } } });
  if (!slip) return;
  await db.payslip.update({
    where: { id: slip.id },
    data: { base: Math.max(0, n(fd.get("base"))), bonus: Math.max(0, n(fd.get("bonus"))), otherDeductions: Math.max(0, n(fd.get("otherDeductions"))), note: str(fd, "note") || null },
  });
  await buildSlips(slip.payRunId);
  revalidatePath(`/app/payroll/${slip.payRunId}`);
}

export async function approvePayRun(id: string) {
  const { run } = await ownRun(id);
  if (run.status !== "DRAFT") return;
  await buildSlips(run.id);
  const slips = await db.payslip.findMany({ where: { payRunId: run.id } });
  await db.$transaction([
    ...slips.map((s) => db.staffAdvance.updateMany({ where: { businessId: run.businessId, userId: s.userId, payslipId: null, date: { lt: run.periodEnd } }, data: { payslipId: s.id } })),
    db.payRun.update({ where: { id: run.id }, data: { status: "APPROVED", approvedAt: new Date() } }),
  ]);
  revalidatePath(`/app/payroll/${id}`);
}

export async function reopenPayRun(id: string) {
  const { run } = await ownRun(id);
  if (run.status !== "APPROVED") return;
  const anyPaid = await db.payslip.count({ where: { payRunId: run.id, paidAt: { not: null } } });
  if (anyPaid) return;
  await db.$transaction([
    db.staffAdvance.updateMany({ where: { payslip: { payRunId: run.id } }, data: { payslipId: null } }),
    db.payRun.update({ where: { id: run.id }, data: { status: "DRAFT", approvedAt: null } }),
  ]);
  revalidatePath(`/app/payroll/${id}`);
}

const METHODS: PaymentMethod[] = ["MPESA", "CASH", "BANK", "OTHER"];

export async function markSlipPaid(fd: FormData) {
  const user = await manager();
  const slip = await db.payslip.findFirst({ where: { id: str(fd, "slipId"), payRun: { businessId: user.businessId, status: { in: ["APPROVED", "PAID"] } } } });
  if (!slip) return;
  const method = (METHODS.includes(str(fd, "method") as PaymentMethod) ? str(fd, "method") : "MPESA") as PaymentMethod;
  await db.payslip.update({ where: { id: slip.id }, data: { paidAt: new Date(), paidMethod: method, paidRef: str(fd, "ref").toUpperCase() || null } });
  const unpaid = await db.payslip.count({ where: { payRunId: slip.payRunId, paidAt: null, net: { gt: 0 } } });
  if (!unpaid) await db.payRun.update({ where: { id: slip.payRunId }, data: { status: "PAID" } });
  revalidatePath(`/app/payroll/${slip.payRunId}`);
}

export async function deletePayRun(id: string) {
  const { run } = await ownRun(id);
  if (run.status !== "DRAFT") return;
  await db.payRun.delete({ where: { id: run.id } });
  redirect("/app/payroll");
}

/* ---------- Advances ---------- */

export async function addAdvance(_: PayState, fd: FormData): Promise<PayState> {
  const user = await manager();
  const staff = await db.user.findFirst({ where: { id: str(fd, "userId"), businessId: user.businessId } });
  const amount = n(fd.get("amount"));
  if (!staff || amount <= 0) return { error: "Choose a staff member and an amount" };
  const date = DateTime.fromISO(str(fd, "date") || DateTime.now().toISODate()!, { zone: user.business.timezone }).set({ hour: 12 });
  await db.staffAdvance.create({ data: { businessId: user.businessId, userId: staff.id, amount, date: date.toJSDate(), note: str(fd, "note") || null } });
  revalidatePath("/app/payroll");
  return { ok: `Recorded KES ${amount.toLocaleString()} advance for ${staff.name}. It comes off their next pay run.` };
}

export async function deleteAdvance(id: string) {
  const user = await manager();
  await db.staffAdvance.deleteMany({ where: { id, businessId: user.businessId, payslipId: null } });
  revalidatePath("/app/payroll");
}

/* ---------- Statutory deduction rules ---------- */

export async function loadKenyaTemplate() {
  const user = await manager();
  await db.business.update({ where: { id: user.businessId }, data: { payrollConfig: KENYA_TEMPLATE as unknown as Prisma.InputJsonValue } });
  revalidatePath("/app/payroll/settings");
}

export async function savePayrollRules(fd: FormData) {
  const user = await manager();
  const current = parseConfig(user.business.payrollConfig);
  const rules: Rule[] = current.rules
    .filter((r) => fd.get(`keep_${r.id}`) === "on")
    .map((r) => {
      if (r.kind === "percent") return { ...r, rate: n(fd.get(`rate_${r.id}`)), min: fd.get(`min_${r.id}`) ? n(fd.get(`min_${r.id}`)) : undefined, max: fd.get(`max_${r.id}`) ? n(fd.get(`max_${r.id}`)) : undefined };
      if (r.kind === "fixed") return { ...r, amount: n(fd.get(`amount_${r.id}`)) };
      return { ...r, relief: n(fd.get(`relief_${r.id}`)), bands: r.bands.map((b, i) => ({ upTo: b.upTo == null ? null : n(fd.get(`band_${r.id}_${i}_upTo`)), rate: n(fd.get(`band_${r.id}_${i}_rate`)) })) };
    });
  const newName = str(fd, "new_name");
  if (newName) {
    const kind = str(fd, "new_kind") === "fixed" ? "fixed" : "percent";
    const id = `${newName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    rules.push(kind === "fixed" ? { id, name: newName, kind, amount: n(fd.get("new_value")), preTax: fd.get("new_preTax") === "on" } : { id, name: newName, kind, rate: n(fd.get("new_value")), preTax: fd.get("new_preTax") === "on" });
  }
  const cfg: PayrollConfig = { rules, note: current.note };
  await db.business.update({ where: { id: user.businessId }, data: { payrollConfig: cfg as unknown as Prisma.InputJsonValue } });
  revalidatePath("/app/payroll/settings");
  redirect("/app/payroll/settings?saved=1");
}
