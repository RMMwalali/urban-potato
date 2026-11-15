// Payroll calculations. Pure functions so they can be tested and reused by pages and actions.
import type { PayType } from "@prisma/client";

/* ---------- Statutory deduction rules (configurable per salon) ---------- */

export type PercentRule = { id: string; name: string; kind: "percent"; rate: number; min?: number; max?: number; preTax: boolean };
export type FixedRule = { id: string; name: string; kind: "fixed"; amount: number; preTax: boolean };
export type PayeRule = { id: string; name: string; kind: "paye"; bands: { upTo: number | null; rate: number }[]; relief: number };
export type Rule = PercentRule | FixedRule | PayeRule;
export type PayrollConfig = { rules: Rule[]; note?: string };

/**
 * Starting template for Kenyan employees, based on rates published for 2025 (monthly amounts):
 * NSSF 6% up to the upper earnings limit, SHIF 2.75% (min KES 300), Affordable Housing Levy 1.5%,
 * PAYE bands with KES 2,400 personal relief; NSSF, SHIF and the levy deducted before PAYE.
 * Rates change. The salon must confirm current rates with KRA / an accountant before relying on them.
 */
export const KENYA_TEMPLATE: PayrollConfig = {
  note: "Kenya template based on 2025 published rates. Verify current rates with KRA or your accountant before paying.",
  rules: [
    { id: "nssf", name: "NSSF", kind: "percent", rate: 6, max: 4320, preTax: true },
    { id: "shif", name: "SHIF", kind: "percent", rate: 2.75, min: 300, preTax: true },
    { id: "ahl", name: "Housing levy", kind: "percent", rate: 1.5, preTax: true },
    {
      id: "paye", name: "PAYE", kind: "paye", relief: 2400,
      bands: [{ upTo: 24000, rate: 10 }, { upTo: 32333, rate: 25 }, { upTo: 500000, rate: 30 }, { upTo: 800000, rate: 32.5 }, { upTo: null, rate: 35 }],
    },
  ],
};

export const EMPTY_CONFIG: PayrollConfig = { rules: [] };

export function parseConfig(raw: unknown): PayrollConfig {
  if (raw && typeof raw === "object" && Array.isArray((raw as PayrollConfig).rules)) return raw as PayrollConfig;
  return EMPTY_CONFIG;
}

const round = (n: number) => Math.round(n * 100) / 100;
const MONTH_DAYS = 365 / 12;

/** Days in a pay period, and its fraction of a month (statutory amounts are monthly). */
export function periodFactor(start: Date, end: Date) {
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400_000));
  return { days, f: Math.abs(days - MONTH_DAYS) <= 3 ? 1 : days / MONTH_DAYS };
}

/** Apply rules to taxable pay. Monthly thresholds are scaled by `f` for weekly/fortnightly runs. */
export function statutoryDeductions(gross: number, cfg: PayrollConfig, f = 1) {
  const lines: { name: string; amount: number }[] = [];
  let preTax = 0;
  for (const r of cfg.rules) {
    if (r.kind === "percent") {
      let a = (gross * r.rate) / 100;
      if (r.min != null) a = Math.max(a, r.min * f);
      if (r.max != null) a = Math.min(a, r.max * f);
      if (gross <= 0) a = 0;
      lines.push({ name: r.name, amount: round(a) });
      if (r.preTax) preTax += a;
    } else if (r.kind === "fixed") {
      const a = gross > 0 ? r.amount * f : 0;
      lines.push({ name: r.name, amount: round(a) });
      if (r.preTax) preTax += a;
    }
  }
  for (const r of cfg.rules) {
    if (r.kind !== "paye") continue;
    const taxable = Math.max(0, gross - preTax);
    let tax = 0, prev = 0;
    for (const b of r.bands) {
      const cap = b.upTo == null ? Infinity : b.upTo * f;
      if (taxable > prev) tax += ((Math.min(taxable, cap) - prev) * b.rate) / 100;
      prev = cap;
    }
    tax = Math.max(0, tax - r.relief * f);
    lines.push({ name: r.name, amount: round(tax) });
  }
  return { lines, total: round(lines.reduce((t, l) => t + l.amount, 0)) };
}

/* ---------- Payslip ---------- */

export type SlipInput = {
  payType: PayType;
  baseSalary: number; // monthly
  chairRent: number; // per run
  statutory: boolean;
  commission: number; // from recorded sales in the period
  tips: number;
  advances: number; // unrecovered advances up to the period end
  bonus?: number;
  otherDeductions?: number;
  baseOverride?: number | null;
};

export function computeSlip(i: SlipInput, cfg: PayrollConfig, f: number) {
  const salaried = i.payType === "SALARY" || i.payType === "BASE_PLUS_COMMISSION";
  const base = i.baseOverride != null ? i.baseOverride : salaried ? round(i.baseSalary * f) : 0;
  const commission = i.payType === "CHAIR_RENTAL" || i.payType === "SALARY" ? 0 : round(i.commission);
  const bonus = round(i.bonus ?? 0);
  const gross = round(base + commission + bonus);
  const stat = i.statutory && i.payType !== "CHAIR_RENTAL" ? statutoryDeductions(gross, cfg, f) : { lines: [], total: 0 };
  const chairRent = i.payType === "CHAIR_RENTAL" ? round(i.chairRent) : 0;
  const other = round(i.otherDeductions ?? 0);
  const net = round(gross + i.tips - stat.total - i.advances - other - chairRent);
  return { base, commission, bonus, gross, tips: round(i.tips), statutory: stat.total, statutoryLines: stat.lines, advances: round(i.advances), otherDeductions: other, chairRent, net };
}

export const PAY_TYPE_LABEL: Record<PayType, string> = {
  COMMISSION: "Commission",
  SALARY: "Salary",
  BASE_PLUS_COMMISSION: "Base + commission",
  CHAIR_RENTAL: "Chair rental",
};
