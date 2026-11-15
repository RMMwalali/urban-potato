"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE = [0.19, 1, 0.22, 1] as const;

export type Feature = { title: string; body: string; detail: string };

/** Ruled uppercase list; hovering a row swaps the text panel on the right. */
export function FeatureList({ features }: { features: Feature[] }) {
  const [i, setI] = useState(0);
  return (
    <div className="grid gap-12 md:grid-cols-2 md:gap-16">
      <ul className="self-end border-t-2 border-ink">
        {features.map((f, k) => (
          <li key={f.title} className="border-b-2 border-ink">
            <button onMouseEnter={() => setI(k)} onFocus={() => setI(k)} onClick={() => setI(k)}
              className={`group flex w-full items-center justify-between gap-4 py-3 text-left text-[clamp(26px,3.4vw,52px)] leading-[1.05] uppercase transition-opacity duration-500 ${i === k ? "opacity-100" : "opacity-40 hover:opacity-100"}`}>
              {f.title}
              <span className={`shrink-0 transition-transform duration-700 ${i === k ? "rotate-45" : ""}`} style={{ transitionTimingFunction: "cubic-bezier(.19,1,.22,1)" }}>↗</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="relative min-h-[420px] overflow-hidden bg-panel p-8 md:min-h-[560px] md:p-10">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.7, ease: EASE }} className="flex h-full min-h-[360px] flex-col justify-between md:min-h-[480px]">
            <p className="label-caps text-muted">{String(i + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}</p>
            <div>
              <p className="text-[clamp(24px,2.4vw,34px)] leading-[1.15]">{features[i].body}</p>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">{features[i].detail}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
