"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Layer, ParallaxScene } from "@/components/motion/Parallax";
import { Lines } from "@/components/motion/Reveal";

const EASE = [0.19, 1, 0.22, 1] as const;
const TYPES = ["Hair", "Barbers", "Nails", "Spa", "Lashes"];

function Lens({ children, className, delay, depth }: { children: React.ReactNode; className: string; delay: number; depth: number }) {
  const reduce = useReducedMotion();
  return (
    <Layer depth={depth} className={`absolute z-10 ${className}`}>
      <motion.a href="#features" initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, delay, ease: EASE }}
        className="lens animate-drift h-28 w-28 p-3 text-[11px] sm:h-[200px] sm:w-[200px] sm:p-6 sm:text-[18px]" style={{ animationDelay: `${delay * 2}s` }}>
        {children}
      </motion.a>
    </Layer>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-between px-5 pt-36 pb-8 sm:px-8 md:pt-44">
      <ParallaxScene className="relative">
        <h1 className="relative text-[clamp(38px,10.4vw,150px)] leading-[0.82] font-normal tracking-[-0.01em] uppercase">
          <span className="sr-only">You don&apos;t need a website. You need a booking engine.</span>
          <span aria-hidden>
            <Lines lines={[<span key="1" className="whitespace-nowrap">Not a website.</span>, "A booking", <span key="3" className="whitespace-nowrap pl-[18%]">engine.</span>]} delay={0.15} />
          </span>
        </h1>
        {/* Phones: circles sit in the space below the headline. Desktop: they float in the gaps between words, overlapping letter edges. */}
        <Lens className="top-[112%] left-0 sm:top-[-16%] sm:right-[1%] sm:left-auto" delay={0.6} depth={0.05}>Online<br />booking</Lens>
        <Lens className="top-[150%] left-[36%] sm:top-[57%] sm:left-0" delay={0.75} depth={0.09}>M-Pesa<br />checkout</Lens>
        <Lens className="top-[112%] right-0 sm:top-[40%] sm:right-auto sm:left-[58%]" delay={0.9} depth={0.07}>Client<br />records</Lens>
      </ParallaxScene>

      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 1, ease: EASE }}
        className="mt-80 max-w-md text-[clamp(16px,1.4vw,20px)] leading-snug sm:mt-16 sm:ml-auto sm:mr-[3%]">
        Your styles already live on Instagram. What your salon needs is bookings, clients and payments in one place.
      </motion.p>
      <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }} className="mt-12 flex flex-wrap justify-between gap-x-8 gap-y-3">
        {TYPES.map((t) => (
          <li key={t}>
            <a href="/signup" className="group flex items-center gap-4 text-[clamp(16px,1.6vw,22px)] uppercase">
              {t}<span className="inline-block transition-transform duration-700 group-hover:rotate-90" style={{ transitionTimingFunction: "cubic-bezier(.19,1,.22,1)" }}>↗</span>
            </a>
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
