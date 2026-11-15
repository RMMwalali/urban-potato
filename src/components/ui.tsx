import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, sub, icon: Icon, children }: { title: string; sub?: React.ReactNode; icon?: LucideIcon; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        {Icon && (
          <span className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-azure-500 text-white shadow-lg shadow-brand-500/30 sm:flex">
            <Icon className="h-6 w-6" strokeWidth={2.2} />
          </span>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, icon: Icon, tone = "brand" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: LucideIcon; tone?: "brand" | "dark" | "lime" | "plain" }) {
  const tones = {
    brand: "bg-gradient-to-br from-brand-600 to-azure-500 text-white border-transparent",
    dark: "bg-navy-900 text-white border-transparent",
    lime: "bg-petal text-navy-950 border-transparent",
    plain: "bg-white",
  } as const;
  const subTone = tone === "plain" ? "text-stone-500" : tone === "lime" ? "text-navy-800/70" : "text-white/70";
  return (
    <div className={`card relative h-full overflow-hidden p-5 ${tones[tone]}`}>
      {Icon && <Icon className={`absolute -right-3 -bottom-3 h-20 w-20 ${tone === "plain" ? "text-stone-100" : "opacity-15"}`} strokeWidth={1.5} />}
      <p className={`text-xs font-semibold uppercase tracking-wider ${subTone}`}>{label}</p>
      <p className="stat-value mt-2">{value}</p>
      {sub && <p className={`mt-1 text-xs ${subTone}`}>{sub}</p>}
    </div>
  );
}

export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="h-7 w-7" /></span>
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "warn" | "error"; children: React.ReactNode }) {
  const t = { info: "bg-sky-50 text-sky-900 border-sky-200", success: "bg-emerald-50 text-emerald-900 border-emerald-200", warn: "bg-amber-50 text-amber-900 border-amber-200", error: "bg-rose-50 text-rose-900 border-rose-200" }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${t}`}>{children}</div>;
}

export const BUSINESS_STATUS_STYLE: Record<string, string> = {
  TRIAL: "bg-sky-100 text-sky-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAST_DUE: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-stone-200 text-stone-600",
};

export function TitleIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-azure-500 text-white shadow-lg shadow-brand-500/30 sm:inline-flex">
      <Icon className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}
