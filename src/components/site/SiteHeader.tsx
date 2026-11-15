"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE = [0.19, 1, 0.22, 1] as const;
const MENU = [
  { href: "#features", label: "What it does" },
  { href: "#why", label: "Why Darling" },
  { href: "#complaints", label: "Built from complaints" },
  { href: "#pricing", label: "Pricing" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Start free trial" },
];

export function SiteHeader({ name, signedIn }: { name: string; signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 80);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[88px] items-center justify-between px-5 sm:px-8 md:h-[110px]">
        <Link href="/" className="relative flex items-center" aria-label={name}>
          <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-ink text-[22px] font-medium text-paper transition-all duration-700 ${scrolled || open ? "opacity-100" : "opacity-100"}`}>{name[0].toLowerCase()}</span>
          <span className={`ml-3 flex items-baseline gap-3 transition-all duration-700 ${scrolled && !open ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100"}`}>
            <span className="text-[30px] font-semibold leading-none tracking-[-0.03em] lowercase text-pink">{name}</span>
            <span className="hidden text-[10px] leading-[1.1] font-medium uppercase sm:block">Salon &amp; spa<br />software</span>
          </span>
        </Link>

        <button onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="absolute left-1/2 hidden h-10 w-[70px] -translate-x-1/2 md:block">
          <span className={`absolute left-0 h-[2px] w-full bg-ink transition-all duration-700 ${open ? "top-1/2 rotate-[20deg]" : "top-[12px]"}`} style={{ transitionTimingFunction: "cubic-bezier(.19,1,.22,1)" }} />
          <span className={`absolute left-0 h-[2px] w-full bg-ink transition-all duration-700 ${open ? "top-1/2 -rotate-[20deg]" : "top-[26px]"}`} style={{ transitionTimingFunction: "cubic-bezier(.19,1,.22,1)" }} />
        </button>

        <div className="flex items-center gap-6">
          <nav className={`hidden items-center gap-6 transition-all duration-700 lg:flex ${scrolled && !open ? "pointer-events-none -translate-y-2 opacity-0" : ""}`}>
            <a href="#features" className="label-caps hover:opacity-50 transition-opacity duration-500">Features</a>
            <a href="#pricing" className="label-caps hover:opacity-50 transition-opacity duration-500">Pricing</a>
            {signedIn ? <Link href="/app" className="btn-secondary">Dashboard</Link> : <><Link href="/login" className="label-caps hover:opacity-50 transition-opacity duration-500">Log in</Link><Link href="/signup" className="btn-secondary">Start free trial</Link></>}
          </nav>
          <button onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-[12px] md:hidden" aria-label="Menu">{open ? "×" : "≡"}</button>
          <Link href={signedIn ? "/app" : "/signup"} className="hidden h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-[11px] font-medium md:flex" title="Kenya · KES">KE</Link>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-30 flex flex-col justify-end bg-paper px-5 pt-32 pb-10 sm:px-8"
            initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: 0.9, ease: EASE }}>
            <ul className="border-t-2 border-ink">
              {MENU.map((m, i) => (
                <motion.li key={m.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06, duration: 0.9, ease: EASE }} className="border-b-2 border-ink">
                  <a href={m.href} onClick={() => setOpen(false)} className="group flex items-center justify-between py-3 text-[clamp(28px,5vw,58px)] leading-none uppercase">
                    {m.label}<span className="transition-transform duration-700 group-hover:rotate-45">↗</span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
