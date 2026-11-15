import Link from "next/link";
import { getSession } from "@/lib/auth";

const features = [
  ["One calendar, every channel", "Bookings from Instagram, WhatsApp, calls and walk-ins all land in one staff calendar. No more double-bookings."],
  ["Online booking link", "Put your link in your social bios. Clients pick a service, stylist and time, 24/7."],
  ["Client records that stick", "Visit history, allergies, preferences and notes, so any stylist can serve any client like a regular."],
  ["Checkout & M-Pesa", "Record cash, M-Pesa and card payments with receipts. Daily totals and staff commissions calculated for you."],
  ["Automatic reminders", "SMS or WhatsApp confirmations and reminders cut no-shows without anyone lifting a phone."],
  ["Reports, not notebooks", "Revenue by day, service and staff member, and top clients, all without a paper ledger."],
];

export default async function Home() {
  const session = await getSession();
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-xl font-semibold text-brand-700">SpaDesk</span>
        <nav className="flex gap-2">
          {session ? (
            <Link href="/app" className="btn-primary">Open dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">Log in</Link>
              <Link href="/signup" className="btn-primary">Start free</Link>
            </>
          )}
        </nav>
      </header>
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Run your salon or spa without the paper book
        </h1>
        <p className="mt-5 text-lg text-stone-600">
          Bookings, client records, payments and reminders in one place, replacing the notebook, the scattered DMs and the guesswork.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary px-5 py-2.5 text-base">Create your salon account</Link>
          <Link href="/book/demo-salon" className="btn-secondary px-5 py-2.5 text-base">See a booking page</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([t, d]) => (
          <div key={t} className="card p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1.5 text-sm text-stone-600">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
