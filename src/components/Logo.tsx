/** Wordmark: name in capitals, first three letters blue, the rest pink (LAA + ZIZI). */
export function Logo({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`font-semibold uppercase leading-none tracking-[-0.02em] ${className}`} aria-label={name}>
      <span aria-hidden className="text-azure-600">{name.slice(0, 3)}</span>
      <span aria-hidden className="text-pink">{name.slice(3)}</span>
    </span>
  );
}
