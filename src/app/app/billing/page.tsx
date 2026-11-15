import { Check, CreditCard, Lock, MessageSquare, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { accessState, getSettings } from "@/lib/platform";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { TiltCard } from "@/components/motion/Tilt";

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
  const wa = general.supportWhatsApp ? `https://wa.me/${general.supportWhatsApp}?text=${encodeURIComponent(`Hi, I'd like to subscribe ${b.name} (${b.slug}) to SpaDesk.`)}` : null;

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
      <PageHeader title="Plan & billing" icon={CreditCard} />
      {!s.ok && (
        <div className="mb-6 flex items-start gap-4 rounded-2xl bg-plum-900 p-5 text-white">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10"><Lock className="h-5 w-5 text-lime-glow" /></span>
          <div>
            <p className="font-display text-xl font-bold">{headline}</p>
            <p className="mt-1 text-sm text-white/70">Your data is safe: clients, bookings and sales are kept. Online booking is paused until you subscribe. Reach us below and we&apos;ll reactivate you right away.</p>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TiltCard max={6}>
            <div className="card relative overflow-hidden bg-gradient-to-br from-plum-950 via-plum-900 to-brand-700 p-8 text-white">
              <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-coral-500/30 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-widest text-lime-glow">SpaDesk Standard</p>
              <p className="mt-3 font-display text-5xl font-extrabold">{general.currency} {general.monthlyPrice.toLocaleString()}<span className="text-lg font-semibold text-white/60"> / month</span></p>
              <p className="mt-2 text-sm text-white/70">One flat price. No per-stylist fees, no commission, no surprises.</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {INCLUDED.map((i) => <li key={i} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-glow" />{i}</li>)}
              </ul>
            </div>
          </TiltCard>
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Current status</p>
            <p className="mt-1 font-display text-xl font-bold">{headline}</p>
            {s.reason === "trial" && <p className="mt-1 text-sm text-stone-500">Trial ends {fmtDate(b.trialEndsAt, b.timezone)}</p>}
            {b.paidUntil && <p className="mt-1 text-sm text-stone-500">Paid until {fmtDate(b.paidUntil, b.timezone)}</p>}
          </div>
          <div className="card space-y-3 p-5">
            <p className="font-display text-lg font-bold">Subscribe or get help</p>
            <p className="text-sm text-stone-500">Pay by M-Pesa. Talk to a real person and we&apos;ll activate your plan the same day.</p>
            {wa && <a href={wa} target="_blank" className="btn-bold w-full"><MessageSquare className="h-4 w-4" /> WhatsApp us</a>}
            {general.supportPhone && <a href={`tel:${general.supportPhone}`} className="btn-secondary w-full"><Phone className="h-4 w-4" /> {general.supportPhone}</a>}
            {general.supportEmail && <a href={`mailto:${general.supportEmail}`} className="btn-secondary w-full">{general.supportEmail}</a>}
            {!wa && !general.supportPhone && !general.supportEmail && <p className="text-xs text-stone-400">Support contact details haven&apos;t been set up yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
