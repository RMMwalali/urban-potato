import Link from "next/link";

export type HomeCard = { id: string; name: string; price: string; salon: string; city: string | null; href: string; img: string; alt: string };
export type HomeLogo = { id: string; name: string; href: string; img: string };

const FALLBACK = ["Box braids", "Silk press", "Fades", "Locs", "Gel manicure", "Lashes", "Facials", "Massage", "Pedicure", "Beard trim", "Knotless", "Wash & blow-dry"];

/** Hero carousel: real service photos from salons the admin features; moving service names otherwise. */
export function ServiceMarquee({ cards }: { cards: HomeCard[] }) {
  if (!cards.length)
    return (
      <div className="mq -mx-5 sm:-mx-8" aria-hidden>
        <div className="mq-track" style={{ ["--mq-dur" as string]: "60s" }}>
          {[...FALLBACK, ...FALLBACK].map((t, i) => (
            <span key={i} className="mq-word px-6 text-[clamp(40px,7vw,104px)] leading-none uppercase">{t}<span className="px-6 text-pink">·</span></span>
          ))}
        </div>
      </div>
    );
  const row = cards.length < 8 ? [...cards, ...cards, ...cards].slice(0, Math.max(8, cards.length)) : cards;
  return (
    <section aria-label="Services booked on Darling HQ" className="mq -mx-5 sm:-mx-8">
      <ul className="mq-track gap-4 px-2" style={{ ["--mq-dur" as string]: `${Math.max(36, row.length * 5)}s` }}>
        {[...row, ...row].map((c, i) => (
          <li key={`${c.id}-${i}`} aria-hidden={i >= row.length || undefined} className="w-[150px] shrink-0 sm:w-[200px]">
            <Link href={c.href} tabIndex={i >= row.length ? -1 : undefined} className="mq-card group block">
              <span className="block aspect-[4/5] overflow-hidden bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.07]" style={{ transitionTimingFunction: "cubic-bezier(.19,1,.22,1)" }} />
              </span>
              <span className="mt-2 flex items-baseline justify-between gap-2 text-[14px]"><span className="truncate">{c.name}</span><span className="shrink-0 tabular-nums text-muted">{c.price}</span></span>
              <span className="label-caps block truncate text-muted">{c.salon}{c.city ? ` · ${c.city}` : ""}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Who we work with": real salon logos the admin picked, in an endless band. */
export function LogoMarquee({ logos }: { logos: HomeLogo[] }) {
  if (!logos.length) return null;
  let row = logos;
  while (row.length < 10) row = [...row, ...logos];
  return (
    <section aria-labelledby="who-we-work-with" className="px-5 pt-24 sm:px-8 md:pt-32">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink pb-4">
        <p id="who-we-work-with" className="label-caps">Who we work with</p>
        <p className="label-caps text-muted">{logos.length} salon{logos.length === 1 ? "" : "s"}</p>
      </div>
      <div className="mq mt-10 -mx-5 sm:-mx-8">
        <ul className="mq-track items-center gap-16 px-8" style={{ ["--mq-dur" as string]: `${Math.max(30, row.length * 3.5)}s` }}>
          {[...row, ...row].map((l, i) => (
            <li key={`${l.id}-${i}`} aria-hidden={i >= logos.length || undefined} className="shrink-0">
              <Link href={l.href} tabIndex={i >= logos.length ? -1 : undefined} className="mq-logo block" title={l.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.img} alt={i < logos.length ? `${l.name} logo` : ""} loading="lazy" className="h-12 w-auto max-w-[180px] object-contain sm:h-16" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
