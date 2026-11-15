import type { Business } from "@prisma/client";
import { connectC2B, savePaymentSettings } from "@/app/actions/payments";
import { c2bUrls } from "@/lib/mpesa";
import { ActionForm } from "./ActionForm";

const METHODS = [
  ["CASH", "Cash"],
  ["MPESA", "M-Pesa"],
  ["CARD", "Card"],
  ["BANK", "Bank transfer"],
] as const;

export function PaymentSettings({ b }: { b: Business }) {
  const urls = c2bUrls(b);
  return (
    <section id="payments" data-tour="payments-settings" className="card space-y-5 p-5">
      <div>
        <h2 className="section-title flex items-center gap-2">Payments & M-Pesa verification</h2>
        <p className="mt-1 text-sm text-stone-500">Choose how clients can pay. Connect your till or paybill to Safaricom and, when staff type an M-Pesa code, the payer&apos;s name and amount fill in automatically. Codes can only be used once.</p>
      </div>
      <form action={savePaymentSettings} className="space-y-5">
        <div>
          <span className="label">Accepted payment methods</span>
          <div className="flex flex-wrap gap-2">
            {METHODS.map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 rounded-none border border-stone-200 px-3 py-2 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
                <input type="checkbox" name={`pm_${k}`} defaultChecked={b.paymentMethods.includes(k)} className="accent-brand-600" /> {label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-500">Untick Cash to run M-Pesa only. Staff can split a bill across any enabled methods.</p>
        </div>
        <label className="flex items-start gap-3 rounded-none bg-stone-50 p-3 text-sm">
          <input type="checkbox" name="requireVerifiedMpesa" defaultChecked={b.requireVerifiedMpesa} className="mt-0.5 accent-brand-600" />
          <span><b>Only accept M-Pesa codes confirmed by Safaricom</b><span className="block text-stone-500">Staff can&apos;t record a code until the payment has actually reached your till. Stops fake or mistyped codes. Needs the connection below.</span></span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Till / paybill shortcode</label><input name="darajaShortcode" defaultValue={b.darajaShortcode ?? b.mpesaNumber ?? ""} className="input" /></div>
          <div><label className="label">Environment</label><select name="darajaEnv" defaultValue={b.darajaEnv} className="input"><option value="production">Production</option><option value="sandbox">Sandbox (testing)</option></select></div>
          <div><label className="label">Daraja consumer key</label><input name="darajaKey" type="password" autoComplete="off" placeholder={b.darajaKeyEnc ? "Saved. Enter a new one to replace" : "From developer.safaricom.co.ke"} className="input" /></div>
          <div><label className="label">Daraja consumer secret</label><input name="darajaSecret" type="password" autoComplete="off" placeholder={b.darajaSecretEnc ? "Saved. Enter a new one to replace" : ""} className="input" /></div>
        </div>
        <button className="btn-primary">Save payment settings</button>
      </form>
      <div className="rounded-none border border-dashed border-stone-300 p-4">
        <p className="flex items-center gap-2 font-semibold">Safaricom connection: {b.c2bRegisteredAt ? <span className="badge bg-emerald-100 text-emerald-800">Connected</span> : <span className="badge bg-stone-200 text-stone-700">Not connected</span>}</p>
        <p className="mt-1 text-xs text-stone-500">Callback URL: <code className="break-all">{urls.confirmation}</code></p>
        <ActionForm action={connectC2B} submit={b.c2bRegisteredAt ? "Reconnect" : "Connect to Safaricom"} submitClass="btn-secondary btn-sm mt-3" className="space-y-2"><span /></ActionForm>
        <p className="mt-2 text-xs text-stone-500">Pochi la Biashara and personal numbers can&apos;t be connected. Use &quot;Paste the M-Pesa SMS&quot; at checkout, or add payments on the Finance page.</p>
      </div>
    </section>
  );
}
