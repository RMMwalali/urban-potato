// Text-only UI primitives: uppercase micro-labels, large uppercase titles, thin rules. No icons.

export function PageHeader({ title, sub, label, children }: { title: string; sub?: React.ReactNode; label?: string; icon?: unknown; children?: React.ReactNode }) {
  return (
    <div className="mb-10 border-b border-ink pb-6">
      {label && <p className="label-caps mb-4 text-muted">{label}</p>}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="mt-3 max-w-2xl text-[15px] text-muted">{sub}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, tone = "plain" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: unknown; tone?: "brand" | "dark" | "lime" | "plain" }) {
  const dark = tone === "dark" || tone === "brand";
  return (
    <div className={`h-full border-t-2 border-ink py-5 pr-4 ${dark ? "bg-ink px-5 text-paper" : ""} ${tone === "lime" ? "bg-panel px-5" : ""}`}>
      <p className={`label-caps ${dark ? "text-paper/60" : "text-muted"}`}>{label}</p>
      <p className="stat-value mt-3">{value}</p>
      {sub && <p className={`mt-1 text-[13px] ${dark ? "text-paper/60" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; icon?: unknown; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="label-caps">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-sm text-[14px] text-muted">{children}</div>}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "warn" | "error"; children: React.ReactNode }) {
  const t = { info: "border-ink", success: "border-azure-600 text-azure-700", warn: "border-ink", error: "border-pink text-pink" }[tone];
  return <div className={`border-l-2 bg-panel px-4 py-3 text-[14px] ${t}`}>{children}</div>;
}

export function TitleIcon(_: { icon?: unknown }) {
  return null;
}

/** Arrow glyph used instead of icons. */
export const Arrow = ({ dir = "ne" }: { dir?: "ne" | "e" }) => <span aria-hidden className="inline-block">{dir === "ne" ? "↗" : "→"}</span>;

export const BUSINESS_STATUS_STYLE: Record<string, string> = {
  TRIAL: "text-azure-600",
  ACTIVE: "text-ink",
  PAST_DUE: "text-pink",
  SUSPENDED: "text-pink",
  CANCELLED: "text-muted",
};
