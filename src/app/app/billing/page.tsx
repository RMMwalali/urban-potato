import { requireUser } from "@/lib/auth";
import { accessState, getSettings } from "@/lib/platform";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { billingFor, foundingOffer, plans as getPlans, type PlanId } from "@/lib/offer";

export const metadata = { title: "Plan & billing" };

const INCLUDED = [
  "Unlimited bookings, clients and staff",
  "Your own online booking link",
  "M-Pesa, cash & card checkout with receipts",
  "SMS / WhatsApp confirmations & reminders",
  "Reports, commission & till reconciliation",
  "Export your data any time, no lock-in",
  "No commission on your clients, ever",
];

export default async function BillingPage() {
  const user = await requireUser(undefined, { allowLocked: true });
  const b = user.business;
  const s = accessState(b);
  const { general } = await getSettings();
  const [offer, pay, plans] = await Promise.all([foundingOffer(), billingFor(b), getPlans()]);
  const paying = s.reason === "active";
  const isLifetime = paying && pay.plan === "lifetime";
  const waFor = (label: string) =>
    general.supportWhatsApp ? `https://wa.me/${general.supportWhatsApp}?text=${encodeURIComponent(`Hi, I'd like ${b.name} (${b.slug}) on the ${general.siteName} ${label} plan.`)}` : null;
  const wa = waFor(paying ? pay.label : "Monthly");
  const cur = plans.currency;
  const founding = !b.foundingMember && offer.enabled;
  const PLANS: { id: PlanId; name: string; price: number; per: string; lines: string[]; open: boolean }[] = [
    { id: "monthly", name: "Monthly", price: plans.monthly.price, per: "/ month", open: true,
      lines: [founding ? `Founding offer: ${cur} ${offer.offerPrice.toLocaleString()} a month for your first ${offer.months} months.` : "Pay as you go. Stop any time."] },
    { id: "annual", name: "Annual", price: plans.annual.price, per: "/ year", open: true,
      lines: [`Works out at ${cur} ${plans.annual.perMonth.toLocaleString()} a month.`, plans.annual.saving > 0 ? `Save ${cur} ${plans.annual.saving.toLocaleString()} a year.` : "", founding ? `Founding ${offer.percent}% off applies to your first ${offer.months} months.` : ""].filter(Boolean) },
    { id: "lifetime", name: "Lifetime", price: plans.lifetime.price, per: "once", open: plans.lifetime.enabled && plans.lifetime.left > 0,
      lines: [`Pay once, use ${general.siteName} for as long as it runs. Includes updates.`, plans.lifetime.enabled ? `${plans.lifetime.left} of ${plans.lifetime.limit} places left.` : "Not available right now.", "Not combined with the founding offer."] },
  ];
  const headline = {
    trial: `${s.daysLeft} ${s.daysLeft === 1 ? "day" : "days"} left in your free trial`,
    trial_over: "Your free trial has ended",
    active: "Your subscription is active",
    expired: "Your subscription has expired",
    suspended: "This account is suspended",
    cancelled: "This account is cancelled",
  }[s.reason];

  return (
    <div className="max-w-5xl">
      <PageHeader title="Plan & billing" label="Account" />
      {!s.ok && (
        <div className="mb-12 bg-ink p-7 text-paper">
          <p className="label-caps text-paper/60">Access paused</p>
          <p className="mt-4 text-[clamp(26px,3vw,40px)] leading-tight uppercase">{headline}</p>
          <p className="mt-4 max-w-2xl text-[15px] text-paper/70">Your data is safe: clients, bookings and sales are kept. Online booking is paused until you subscribe. Reach us below and we&apos;ll reactivate you right away.</p>
        </div>
      )}
      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="label-caps">{paying ? `Your plan · ${pay.label}` : "Choose a plan"}</p>
          {paying && (
            <>
              <p className="mt-6 text-[clamp(48px,7vw,96px)] leading-none tracking-[-0.02em]">{cur} {pay.price.toLocaleString()}<span className="text-[18px] tracking-normal text-muted"> {pay.period === "once" ? "paid once" : `/ ${pay.period}`}</span></p>
              {pay.discounted && <p className="mt-3 text-[15px] text-muted">Founding member: {pay.percent}% off until {fmtDate(pay.until!, b.timezone)}, then {cur} {pay.base.toLocaleString()} a {pay.period}.</p>}
            </>
          )}
          <div className="mt-8 border-t-2 border-ink">
            {PLANS.map((p) => {
              const current = paying && pay.plan === p.id;
              const link = waFor(p.name);
              return (
                <div key={p.id} className={`grid gap-4 border-b border-ink/30 py-6 sm:grid-cols-[1fr_auto] sm:items-end ${!p.open && !current ? "opacity-45" : ""}`}>
                  <div>
                    <p className="label-caps">{p.name}{current && <span className="ml-2 text-pink">· Current</span>}{p.id === "annual" && <span className="ml-2 text-azure-600">· 2 months free</span>}</p>
                    <p className="mt-2 text-[clamp(28px,3vw,40px)] leading-none">{cur} {p.price.toLocaleString()}<span className="text-[14px] text-muted"> {p.per}</span></p>
                    {p.lines.map((l) => <p key={l} className="mt-2 text-[14px] text-muted">{l}</p>)}
                  </div>
                  {!current && !isLifetime && p.open && link && <a href={link} target="_blank" className="btn-secondary btn-sm">{paying ? "Switch" : "Choose"} {p.name.toLowerCase()}</a>}
                </div>
              );
            })}
          </div>
          <p className="label-caps mt-12">Every plan includes</p>
          <ol className="mt-4 border-t-2 border-ink">
            {INCLUDED.map((i, k) => (
              <li key={i} className="flex gap-4 border-b border-ink/30 py-3 text-[16px]"><sup className="pt-2 text-[11px]">{k + 1}</sup>{i}</li>
            ))}
          </ol>
        </div>
        <div className="space-y-10 lg:col-span-2">
          <div className="border-t-2 border-ink pt-4">
            <p className="label-caps text-muted">Current status</p>
            <p className="mt-3 text-[22px] leading-tight">{headline}</p>
            {s.reason === "trial" && <p className="mt-1 text-[14px] text-muted">Trial ends {fmtDate(b.trialEndsAt, b.timezone)}</p>}
            {isLifetime ? <p className="mt-1 text-[14px] text-muted">Lifetime plan: nothing more to pay.</p> : b.paidUntil && <p className="mt-1 text-[14px] text-muted">Paid until {fmtDate(b.paidUntil, b.timezone)}</p>}
          </div>
          <div className="border-t-2 border-ink pt-4">
            <p className="label-caps text-muted">Subscribe or get help</p>
            <p className="mt-3 text-[15px] text-muted">Pay by M-Pesa. Talk to a real person and we&apos;ll activate your plan the same day.</p>
            <div className="mt-6 flex flex-col gap-2">
              {wa && <a href={wa} target="_blank" className="btn-primary">WhatsApp us</a>}
              {general.supportPhone && <a href={`tel:${general.supportPhone}`} className="btn-secondary">{general.supportPhone}</a>}
              {general.supportEmail && <a href={`mailto:${general.supportEmail}`} className="btn-secondary normal-case">{general.supportEmail}</a>}
              {!wa && !general.supportPhone && !general.supportEmail && <p className="text-[13px] text-muted">Support contact details haven&apos;t been set up yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
