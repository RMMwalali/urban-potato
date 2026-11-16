import { Reveal } from "@/components/motion/Reveal";

type R = { id: string; rating: number; body: string; authorName: string; authorRole: string | null; salonName: string; city: string | null };

/** "What salons say": real, approved reviews only. Nothing renders until there's at least one. */
export function Reviews({ reviews, average, count }: { reviews: R[]; average: number | null; count: number }) {
  if (!reviews.length) return null;
  return (
    <section id="reviews" className="px-5 pt-32 sm:px-8 md:pt-48">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
        <p className="label-caps">What salons say</p>
        {count >= 5 && average && <p className="label-caps text-muted">{average} / 5 from {count} salons</p>}
      </div>
      <ul className="grid gap-x-10 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-ink/30 py-8">
            <Reveal>
              <p className="label-caps text-pink">{r.rating} / 5</p>
              <blockquote className="mt-4 text-[clamp(18px,1.6vw,22px)] leading-snug">“{r.body}”</blockquote>
              <p className="mt-4 text-[14px] text-muted">{r.authorName}{r.authorRole ? `, ${r.authorRole}` : ""} · {r.salonName}{r.city ? `, ${r.city}` : ""}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
