import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { displayPhone, fmtDate, fmtDateTime, METHOD_LABEL, money, num } from "@/lib/format";
import { PAY_TYPE_LABEL } from "@/lib/payroll";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Payslip" };

export default async function PayslipPage({ params }: { params: Promise<{ slipId: string }> }) {
  const { slipId } = await params;
  const user = await requireUser();
  const s = await db.payslip.findFirst({ where: { id: slipId, payRun: { businessId: user.businessId } }, include: { user: true, payRun: true } });
  // Managers see every slip; staff only their own, and only once approved
  if (!s || (!MANAGERS.includes(user.role) && (s.userId !== user.id || s.payRun.status === "DRAFT"))) notFound();
  const b = user.business, c = b.currency, tz = b.timezone;
  const lines = (s.statutoryLines as { name: string; amount: number }[] | null) ?? [];
  const net = num(s.net);
  const row = (k: string, v: Parameters<typeof num>[0], neg = false) => (
    <div className="flex justify-between border-b border-ink/15 py-2"><span>{k}</span><span className="tabular-nums">{neg && num(v) ? "−" : ""}{money(num(v), c)}</span></div>
  );
  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={MANAGERS.includes(user.role) ? `/app/payroll/${s.payRunId}` : "/app/me"} className="label-caps text-muted hover:text-ink">← Back</Link>
        <PrintButton />
      </div>
      <div className="border-t-2 border-ink bg-panel p-6 text-[15px] sm:p-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div><p className="label-caps text-muted">Payslip</p><p className="mt-1 text-[24px] uppercase">{b.name}</p></div>
          <div className="text-right text-[13px] text-muted"><p>{fmtDate(s.payRun.periodStart, tz)} – {fmtDate(new Date(s.payRun.periodEnd.getTime() - 1), tz)}</p>{s.payRun.status === "DRAFT" && <p className="text-pink">Draft</p>}</div>
        </div>
        <div className="mt-6 border-t border-ink pt-4">
          <p className="text-[20px]">{s.user.name}</p>
          <p className="label-caps text-muted">{s.user.title ? `${s.user.title} · ` : ""}{PAY_TYPE_LABEL[s.payType]} · {s.services} services</p>
        </div>
        <p className="label-caps mt-6 mb-1">Earnings</p>
        {row("Base pay", s.base)}{row("Commission", s.commission)}{row("Bonus", s.bonus)}
        <div className="flex justify-between py-2 font-medium"><span>Gross pay</span><span className="tabular-nums">{money(s.gross, c)}</span></div>
        <p className="label-caps mt-4 mb-1">Deductions</p>
        {lines.map((l) => <div key={l.name}>{row(l.name, l.amount, true)}</div>)}
        {num(s.advances) > 0 && row("Salary advances", s.advances, true)}
        {num(s.otherDeductions) > 0 && row(s.note ? `Other (${s.note})` : "Other deductions", s.otherDeductions, true)}
        {num(s.chairRent) > 0 && row("Chair rent", s.chairRent, true)}
        {lines.length === 0 && !num(s.advances) && !num(s.otherDeductions) && !num(s.chairRent) && <p className="py-2 text-muted">None</p>}
        <p className="label-caps mt-4 mb-1">Tips</p>
        {row("Tips received", s.tips)}
        <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink pt-4">
          <span className="label-caps">{net < 0 ? "Owed to the salon" : "Net pay"}</span>
          <span className="text-[30px] tabular-nums">{money(Math.abs(net), c)}</span>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          {s.paidAt ? `Paid ${fmtDateTime(s.paidAt, tz)} by ${s.paidMethod ? METHOD_LABEL[s.paidMethod] : ""}${s.paidRef ? ` (${s.paidRef})` : ""}` : "Not paid yet"}
          {s.user.payoutPhone ? ` · M-Pesa ${displayPhone(s.user.payoutPhone)}` : ""}
        </p>
      </div>
    </div>
  );
}
