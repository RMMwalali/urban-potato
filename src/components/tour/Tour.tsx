"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { finishTour } from "@/app/actions/auth";
import type { TourStep } from "./steps";

const EASE = [0.19, 1, 0.22, 1] as const;
const KEY = "darling-tour-step";
type Rect = { top: number; left: number; width: number; height: number };

function findTarget(id?: string) {
  if (!id) return null;
  const els = [...document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)];
  return els.find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; }) ?? null;
}

/**
 * Animated product tour: a spotlight glides to each feature with a tooltip, across pages.
 * Auto-starts on first login; replay with the "Take the tour" button (dispatches `darling:tour`).
 */
export function Tour({ steps, autoStart }: { steps: TourStep[]; autoStart: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [paused, setPaused] = useState(false);
  const [mobile, setMobile] = useState(false);
  const navigating = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // start: auto on first login, or resume a tour in progress after a reload
  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved != null) setIndex(Number(saved));
    else if (autoStart) setIndex(0);
    const replay = () => { setPaused(false); go(0); };
    window.addEventListener("darling:tour", replay);
    const mq = () => setMobile(window.innerWidth < 768);
    mq(); window.addEventListener("resize", mq);
    return () => { window.removeEventListener("darling:tour", replay); window.removeEventListener("resize", mq); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = index != null ? steps[index] : null;

  const go = useCallback((i: number) => {
    sessionStorage.setItem(KEY, String(i));
    setIndex(i); setRect(null); setPaused(false);
    const target = steps[i];
    if (target && window.location.pathname !== target.path) { navigating.current = true; router.push(target.path); }
  }, [router, steps]);

  const end = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setIndex(null); setRect(null); setPaused(false);
    finishTour();
  }, []);

  // If the user navigates away on their own, pause rather than drag them back
  useEffect(() => {
    if (!step) return;
    if (path === step.path) { navigating.current = false; setPaused(false); return; }
    if (!navigating.current) setPaused(true);
  }, [path, step]);

  // find, scroll to and track the target element
  useLayoutEffect(() => {
    if (!step || paused || path !== step.path) return;
    let raf = 0, tries = 0, el: HTMLElement | null = null;
    const measure = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = 8;
      setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
    };
    const seek = () => {
      el = findTarget(step.target);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        setTimeout(measure, reduce ? 0 : 420);
        measure();
      } else if (step.target && tries++ < 60) raf = requestAnimationFrame(seek);
      else setRect(null); // no target (or hidden on this screen): centred card
    };
    seek();
    const on = () => measure();
    window.addEventListener("scroll", on, true); window.addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", on, true); window.removeEventListener("resize", on); };
  }, [step, paused, path, reduce]);

  // keyboard
  useEffect(() => {
    if (index == null || paused) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
      else if (e.key === "ArrowRight") index < steps.length - 1 ? go(index + 1) : end();
      else if (e.key === "ArrowLeft" && index > 0) go(index - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, paused, steps.length, go, end]);

  useEffect(() => { if (step && !paused) cardRef.current?.focus({ preventScroll: true }); }, [index, paused, step]);

  if (index == null || !step) return null;

  if (paused) {
    return (
      <div className="fixed right-4 bottom-4 z-[60] flex items-center gap-2 border-2 border-ink bg-paper px-4 py-3 print:hidden">
        <span className="label-caps">Tour paused · {index + 1}/{steps.length}</span>
        <button onClick={() => go(index)} className="btn-primary btn-sm">Resume tour</button>
        <button onClick={end} className="label-caps text-muted hover:text-ink">End</button>
      </div>
    );
  }

  // tooltip placement: below the target if there's room, otherwise above; centred without a target; bottom sheet on phones
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200, vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardW = Math.min(380, vw - 32);
  let cardStyle: React.CSSProperties;
  if (mobile) cardStyle = { left: 16, right: 16, bottom: 16 };
  else if (!rect) cardStyle = { left: (vw - cardW) / 2, top: vh / 2 - 120, width: cardW };
  else if (rect.height > vh * 0.55) cardStyle = { right: 24, bottom: 24, width: cardW }; // tall target: park the card in the corner
  else {
    const below = rect.top + rect.height + 16, fitsBelow = below + 230 < vh;
    const top = fitsBelow ? below : Math.max(16, rect.top - 246);
    const left = Math.min(Math.max(16, rect.left), vw - cardW - 16);
    cardStyle = { left, top, width: cardW };
  }
  const last = index === steps.length - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] print:hidden" aria-live="polite">
      {/* spotlight: a hole in the dimmed screen that glides between targets */}
      {rect ? (
        <motion.div
          className="absolute rounded-[14px]"
          initial={false}
          animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 26 }}
          style={{ boxShadow: "0 0 0 200vmax rgba(28,31,36,0.62)" }}
        >
          {!reduce && <span className="absolute inset-0 animate-ping rounded-[14px] border-2 border-pink opacity-60" style={{ animationDuration: "1.8s" }} />}
          <span className="absolute inset-0 rounded-[14px] border-2 border-pink" />
        </motion.div>
      ) : (
        <motion.div className="absolute inset-0 bg-ink/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          ref={cardRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-label={`Tour step ${index + 1} of ${steps.length}: ${step.title}`}
          className="pointer-events-auto absolute border-2 border-ink bg-paper p-5 outline-none"
          style={cardStyle}
          initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <div className="mb-3 h-px bg-ink/20"><motion.div className="h-px bg-pink" initial={false} animate={{ width: `${((index + 1) / steps.length) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} /></div>
          <p className="label-caps text-muted">{index + 1} / {steps.length}</p>
          <p className="mt-2 text-[22px] leading-tight uppercase">{step.title}</p>
          <p className="mt-2 text-[15px] leading-snug">{step.body}</p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <button onClick={end} className="label-caps text-muted hover:text-ink">Skip tour</button>
            <div className="flex gap-2">
              {index > 0 && <button onClick={() => go(index - 1)} className="btn-secondary btn-sm">Back</button>}
              <button onClick={() => (last ? end() : go(index + 1))} className="btn-primary btn-sm">{last ? "Finish" : "Next"}</button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Sidebar link that (re)starts the tour. */
export function TourButton() {
  return (
    <button data-tour="tour-button" onClick={() => window.dispatchEvent(new Event("darling:tour"))} className="label-caps text-left hover:opacity-50">
      Take the tour
    </button>
  );
}
