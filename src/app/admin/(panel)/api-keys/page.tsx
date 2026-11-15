import { db } from "@/lib/db";
import { PROVIDERS } from "@/lib/platform";
import { fmtDateTime } from "@/lib/format";
import { deleteCredential, saveCredential } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/ActionForm";
import { PageHeader } from "@/components/ui";

const HELP: Record<string, string> = {
  MESSAGE_PROVIDER: "console | africastalking | whatsapp",
  AT_USERNAME: "Use 'sandbox' for testing",
  MPESA_ENV: "sandbox | production",
  WHATSAPP_TEMPLATE_LANG: "e.g. en or en_US",
};

export default async function ApiKeysPage() {
  const creds = await db.apiCredential.findMany();
  const find = (p: string, n: string) => creds.find((c) => c.provider === p && c.name === n);
  return (
    <div className="max-w-5xl">
      <PageHeader title="API keys" sub="Credentials for SMS, WhatsApp and M-Pesa. Encrypted at rest (AES-256-GCM); values are never shown again after saving." />
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
                      <p className="text-xs text-stone-500">{c ? <>••••{c.last4} · updated {fmtDateTime(c.updatedAt, "Africa/Nairobi")}</> : process.env[name] ? "Using server environment value" : HELP[name] ?? "Not set"}</p>
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
