/** Wordmark: name in capitals, first two letters blue, the rest pink (LA + AZIZI). */
export function Logo({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`font-semibold uppercase leading-none tracking-[-0.02em] ${className}`} aria-label={name}>
      <span aria-hidden className="text-azure-600">{name.slice(0, 2)}</span>
      <span aria-hidden className="text-pink">{name.slice(2)}</span>
    </span>
  );
}
