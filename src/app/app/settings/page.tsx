import { MANAGERS, requireUser } from "@/lib/auth";
import { saveSettings } from "@/app/actions/manage";
import { Settings, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { PaymentSettings } from "@/components/PaymentSettings";

export const metadata = { title: "Settings" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const provider = process.env.MESSAGE_PROVIDER ?? "console";

  return (
    <>
    <form action={saveSettings} className="max-w-3xl space-y-5">
      <PageHeader title="Settings" icon={Settings} />
      {sp.saved && <p className="card bg-emerald-50 p-3 text-sm text-emerald-800">Settings saved.</p>}
      {sp.error === "slug" && <p className="card bg-rose-50 p-3 text-sm text-rose-800">That booking link is already taken. Choose another.</p>}

      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="section-title sm:col-span-2">Business</h2>
        <div><label className="label">Name</label><input name="name" defaultValue={b.name} className="input" required /></div>
        <div><label className="label">Phone</label><input name="phone" defaultValue={b.phone ?? ""} className="input" /></div>
        <div><label className="label">Email</label><input name="email" type="email" defaultValue={b.email ?? ""} className="input" /></div>
        <div><label className="label">Address / location</label><input name="address" defaultValue={b.address ?? ""} className="input" /></div>
        <div><label className="label">Currency</label><input name="currency" defaultValue={b.currency} className="input" maxLength={3} /></div>
        <div><label className="label">Timezone</label><input name="timezone" defaultValue={b.timezone} className="input" /></div>
        <div><label className="label">Phone country code</label><input name="countryCode" defaultValue={b.countryCode} className="input" /></div>
      </section>

      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="section-title sm:col-span-2">Opening hours & online booking</h2>
        <div><label className="label">Opens</label><input type="time" name="openTime" defaultValue={b.openTime} className="input" /></div>
        <div><label className="label">Closes</label><input type="time" name="closeTime" defaultValue={b.closeTime} className="input" /></div>
        <div className="sm:col-span-2">
          <span className="label">Open days</span>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d, i) => (
              <label key={d} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="openDays" value={i + 1} defaultChecked={b.openDays.includes(i + 1)} className="accent-brand-600" /> {d}
              </label>
            ))}
          </div>
        </div>
        <div><label className="label">Booking link</label><div className="flex items-center gap-1 text-sm text-stone-500">/book/<input name="slug" defaultValue={b.slug} className="input" /></div></div>
        <div>
          <label className="label">Online slot interval</label>
          <select name="slotMinutes" defaultValue={b.slotMinutes} className="input">
            {[10, 15, 20, 30, 60].map((m) => <option key={m} value={m}>Every {m} minutes</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="bookingEnabled" defaultChecked={b.bookingEnabled} className="accent-brand-600" /> Accept online bookings</label>
      </section>

      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="section-title flex items-center gap-2 sm:col-span-2"><Wallet className="h-5 w-5 text-brand-600" /> M-Pesa & deposits</h2>
        <p className="text-sm text-stone-500 sm:col-span-2">Payments go straight to your own M-Pesa. We never hold your money. Deposits cut no-shows: clients pay when booking online and enter the code.</p>
        <div>
          <label className="label">Receive payments on</label>
          <select name="mpesaType" defaultValue={b.mpesaType ?? ""} className="input">
            <option value="">Not set</option><option value="TILL">Buy Goods Till</option><option value="PAYBILL">Paybill</option><option value="POCHI">Pochi la Biashara</option><option value="PHONE">Send Money (phone)</option>
          </select>
        </div>
        <div><label className="label">Till / paybill / phone number</label><input name="mpesaNumber" defaultValue={b.mpesaNumber ?? ""} className="input" /></div>
        <div><label className="label">Paybill account (optional)</label><input name="mpesaAccount" defaultValue={b.mpesaAccount ?? ""} className="input" /></div>
        <div>
          <label className="label">Online booking deposit</label>
          <select name="depositPercent" defaultValue={b.depositPercent} className="input">
            {[0, 10, 20, 25, 30, 50, 100].map((p) => <option key={p} value={p}>{p === 0 ? "No deposit" : `${p}% of service price`}</option>)}
          </select>
        </div>
        <div><label className="label">Clients can cancel online until</label>
          <select name="cancelPolicyHours" defaultValue={b.cancelPolicyHours} className="input">{[0, 2, 6, 12, 24, 48].map((h) => <option key={h} value={h}>{h === 0 ? "Any time" : `${h} hours before`}</option>)}</select>
        </div>
        <div><label className="label">Clean-up time between bookings</label>
          <select name="bufferMinutes" defaultValue={b.bufferMinutes} className="input">{[0, 5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m === 0 ? "None" : `${m} minutes`}</option>)}</select>
        </div>
        <div className="sm:col-span-2"><label className="label">Cancellation policy shown to clients (optional)</label><textarea name="cancelPolicyText" defaultValue={b.cancelPolicyText ?? ""} rows={2} className="input" placeholder="Leave blank to use the standard wording" /></div>
      </section>

      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="section-title sm:col-span-2">Reminders & messages</h2>
        <div>
          <label className="label">Channel</label>
          <select name="messageChannel" defaultValue={b.messageChannel} className="input">
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
        <div>
          <label className="label">Send reminder</label>
          <select name="reminderHours" defaultValue={b.reminderHours} className="input">
            {[2, 4, 12, 24, 48].map((h) => <option key={h} value={h}>{h} hours before</option>)}
          </select>
        </div>
        <p className="text-xs text-stone-500 sm:col-span-2">
          Delivery provider: <b>{provider}</b>.{provider === "console" && " Messages are logged but not delivered. Configure Africa's Talking or WhatsApp in the server environment to go live."}
        </p>
      </section>

      <button className="btn-primary">Save settings</button>
    </form>
    <div className="mt-6 max-w-3xl"><PaymentSettings b={b} /></div>
    </>
  );
}
