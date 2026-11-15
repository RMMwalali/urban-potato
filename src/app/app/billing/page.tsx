import { requireUser } from "@/lib/auth";
import { accessState, getSettings } from "@/lib/platform";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { foundingOffer, monthlyPriceFor } from "@/lib/offer";

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
  const [offer, pay] = await Promise.all([foundingOffer(), monthlyPriceFor(b)]);
  const wa = general.supportWhatsApp ? `https://wa.me/${general.supportWhatsApp}?text=${encodeURIComponent(`Hi, I'd like to subscribe ${b.name} (${b.slug}) to ${general.siteName}${!b.foundingMember && offer.enabled ? " with the founding offer" : ""}.`)}` : null;
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
          <p className="label-caps">{general.siteName} standard</p>
          <p className="mt-6 text-[clamp(56px,8vw,112px)] leading-none tracking-[-0.02em]">{general.currency} {pay.price.toLocaleString()}<span className="text-[18px] tracking-normal text-muted"> / month</span></p>
          <p className="mt-3 text-[15px] text-muted">
            {pay.discounted ? <>Founding member: {pay.percent}% off until {fmtDate(pay.until!, b.timezone)}, then {general.currency} {general.monthlyPrice.toLocaleString()} a month.</> : "One flat price. No per-stylist fees, no commission, no surprises."}
          </p>
          {!b.foundingMember && offer.enabled && (
            <p className="mt-6 border-l-2 border-pink bg-panel px-4 py-3 text-[15px]">
              Founding offer: subscribe now and pay <b className="font-medium">{offer.currency} {offer.offerPrice.toLocaleString()}</b> a month for your first {offer.months} months ({offer.percent}% off). {offer.left} of {offer.slots} places left.
            </p>
          )}
          <ol className="mt-10 border-t-2 border-ink">
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
            {b.paidUntil && <p className="mt-1 text-[14px] text-muted">Paid until {fmtDate(b.paidUntil, b.timezone)}</p>}
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
