export function SeoPreview({ url, title, description }: { url: string; title: string; description: string }) {
  const t = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  const d = description.length > 160 ? `${description.slice(0, 157)}…` : description;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Google preview</p>
      <p className="truncate text-xs text-emerald-800">{url}</p>
      <p className="truncate text-lg leading-snug text-[#1a0dab]">{t}</p>
      <p className="line-clamp-2 text-sm text-stone-600">{d}</p>
      <p className={`mt-2 text-[11px] ${title.length > 60 ? "text-amber-700" : "text-stone-400"}`}>Title {title.length}/60 · Description <span className={description.length > 160 ? "text-amber-700" : ""}>{description.length}/160</span></p>
    </div>
  );
}
