"use client";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.19, 1, 0.22, 1] as const;

/** Fade + rise into view (1s, expo-out), the reference site's section reveal. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

/** Each line slides up from behind a mask. */
export function Lines({ lines, className = "", lineClass = "", delay = 0, inView = false }: { lines: React.ReactNode[]; className?: string; lineClass?: string; delay?: number; inView?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          {reduce ? (
            <span className={`block ${lineClass}`}>{l}</span>
          ) : (
            <motion.span
              className={`block ${lineClass}`}
              initial={{ y: "105%" }}
              {...(inView ? { whileInView: { y: "0%" }, viewport: { once: true, margin: "-60px" } } : { animate: { y: "0%" } })}
              transition={{ duration: 1.2, delay: delay + i * 0.12, ease: EASE }}
            >
              {l}
            </motion.span>
          )}
        </span>
      ))}
    </span>
  );
}
