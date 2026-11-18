/** "Laazizi HQ" -> the wordmark ("LAAZIZI") and its mark ("HQ"); a name without HQ keeps no mark. */
export function splitBrand(name: string) {
  const m = name.trim().match(/^(.*?)\s+(HQ)$/i);
  return m ? { word: m[1], mark: m[2].toUpperCase() } : { word: name.trim(), mark: "" };
}

/** Wordmark: name in capitals, first three letters blue, the rest pink (LAA + ZIZI), with a small HQ at the top right. */
export function Logo({ name, className = "" }: { name: string; className?: string }) {
  const { word, mark } = splitBrand(name);
  return (
    <span className={`font-semibold uppercase leading-none tracking-[-0.02em] ${className}`} aria-label={name}>
      <span aria-hidden className="text-azure-600">{word.slice(0, 3)}</span>
      <span aria-hidden className="text-pink">{word.slice(3)}</span>
      {mark && <span aria-hidden className="relative ml-[0.07em] align-top text-[0.34em] leading-none tracking-normal text-ink" style={{ top: "0.02em" }}>{mark}</span>}
    </span>
  );
}
