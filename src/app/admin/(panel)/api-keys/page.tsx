import { db } from "@/lib/db";
import { PROVIDERS } from "@/lib/platform";
import { fmtDateTime } from "@/lib/format";
import { deleteCredential, rotatePushKeys, saveCredential, sendPushTestToAll } from "@/app/actions/admin";
import { pushSubject, vapidKeys } from "@/lib/notify";
import { ConfirmButton } from "@/components/ActionForm";
import { PageHeader } from "@/components/ui";

const HELP: Record<string, string> = {
  MESSAGE_PROVIDER: "console | africastalking | whatsapp",
  AT_USERNAME: "Use 'sandbox' for testing",
  MPESA_ENV: "sandbox | production",
  WHATSAPP_TEMPLATE_LANG: "e.g. en or en_US",
  VAPID_PUBLIC_KEY: "Optional: leave empty to use the automatic keys",
  VAPID_PRIVATE_KEY: "Optional: must pair with the public key",
  VAPID_SUBJECT: "Contact for push services, e.g. mailto:you@yourdomain.com",
};

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<{ rotated?: string; pushed?: string; failed?: string }> }) {
  const sp = await searchParams;
  const week = new Date(Date.now() - 7 * 86400_000);
  const [creds, keys, subject, devices, sentWeek] = await Promise.all([
    db.apiCredential.findMany(),
    vapidKeys(),
    pushSubject(),
    db.pushSubscription.count(),
    db.notification.count({ where: { createdAt: { gte: week } } }),
  ]);
  const find = (p: string, n: string) => creds.find((c) => c.provider === p && c.name === n);
  return (
    <div className="max-w-5xl">
      <PageHeader title="Connections" sub="Keys for SMS, WhatsApp, M-Pesa and push notifications. Encrypted at rest (AES-256-GCM); secret values are never shown again after saving." />
      {sp.rotated && <p className="mb-6 border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">New push keys generated. {sp.rotated} device(s) were signed out of push and need to turn notifications on again.</p>}
      {sp.pushed && <p className="mb-6 border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">Test sent to {sp.pushed} device(s){Number(sp.failed) ? `, ${sp.failed} failed` : ""}.</p>}

      <section className="card mb-6 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="section-title">Notifications status</h2>
          <span className="label-caps text-muted">Web Push · in-app sounds</span>
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-[14px] sm:grid-cols-2">
          <div><dt className="label-caps text-muted">Keys</dt><dd>{keys.source === "auto" ? "Generated automatically (stored encrypted)" : keys.source === "admin" ? "Set below" : "From the server environment"}</dd></div>
          <div><dt className="label-caps text-muted">Contact sent to push services</dt><dd className="break-all">{subject}</dd></div>
          <div><dt className="label-caps text-muted">Devices receiving push</dt><dd>{devices}</dd></div>
          <div><dt className="label-caps text-muted">Notifications in the last 7 days</dt><dd>{sentWeek}</dd></div>
          <div className="sm:col-span-2"><dt className="label-caps text-muted">Public key</dt><dd className="break-all font-mono text-[12px]">{keys.publicKey}</dd></div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <form action={sendPushTestToAll}><button className="btn-secondary btn-sm" disabled={!devices}>Send a test to all devices</button></form>
          {keys.source === "auto" && (
            <form action={rotatePushKeys}><ConfirmButton className="btn-secondary btn-sm" message="Generate new push keys? Every device will need to turn notifications on again.">Generate new keys</ConfirmButton></form>
          )}
        </div>
        <p className="mt-3 text-[12px] text-muted">No setup needed: keys are created automatically. Only add your own below if you already have a VAPID key pair (changing keys signs all devices out of push). In-app notifications and sounds don&apos;t need any keys.</p>
      </section>

      <div className="space-y-6">
        {Object.entries(PROVIDERS).map(([provider, cfg]) => (
          <section key={provider} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-5 py-4">
              <h2 className="section-title">{cfg.label}</h2>
              <span className="text-xs text-stone-500">{cfg.fields.filter((f) => find(provider, f)).length}/{cfg.fields.length} set</span>
            </div>
            <ul className="divide-y divide-stone-100">
              {cfg.fields.map((name) => {
                const c = find(provider, name);
                return (
                  <li key={name} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="w-60">
                      <p className="font-mono text-sm font-semibold">{name}</p>
                      <p className="text-[13px] text-muted">{c ? <>••••{c.last4} · updated {fmtDateTime(c.updatedAt, "Africa/Nairobi")}</> : process.env[name] ? "Using server environment value" : HELP[name] ?? "Not set"}</p>
                    </div>
                    <form action={saveCredential} className="flex flex-1 gap-2">
                      <input type="hidden" name="provider" value={provider} /><input type="hidden" name="name" value={name} />
                      <input name="value" type="password" autoComplete="off" placeholder={c ? "Enter a new value to replace" : "Enter value"} className="input" required />
                      <button className="btn-secondary">{c ? "Replace" : "Save"}</button>
                    </form>
                    {c && <form action={deleteCredential.bind(null, c.id)}><ConfirmButton message={`Delete ${name}?`}>Delete</ConfirmButton></form>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
