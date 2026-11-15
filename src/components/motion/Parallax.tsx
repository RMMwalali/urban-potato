"use client";
// Mouse-driven parallax depth layers (3d-animations skill). Each child layer gets a depth multiplier.
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { createContext, useContext } from "react";

const Ctx = createContext<{ x: MotionValue<number>; y: MotionValue<number> } | null>(null);

export function ParallaxScene({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const x = useSpring(useMotionValue(0), { stiffness: 80, damping: 20 });
  const y = useSpring(useMotionValue(0), { stiffness: 80, damping: 20 });
  return (
    <Ctx.Provider value={{ x, y }}>
      <div
        className={className}
        style={{ perspective: 1400 }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - r.left - r.width / 2);
          y.set(e.clientY - r.top - r.height / 2);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function Layer({ depth, children, className = "", rotate = false }: { depth: number; children: React.ReactNode; className?: string; rotate?: boolean }) {
  const ctx = useContext(Ctx)!;
  const reduce = useReducedMotion();
  const tx = useTransform(ctx.x, (v) => v * depth);
  const ty = useTransform(ctx.y, (v) => v * depth);
  const rx = useTransform(ctx.y, (v) => (rotate ? -v * 0.012 : 0));
  const ry = useTransform(ctx.x, (v) => (rotate ? v * 0.012 : 0));
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} style={{ x: tx, y: ty, rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>
      {children}
    </motion.div>
  );
}
