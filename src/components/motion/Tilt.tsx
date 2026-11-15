"use client";
// 3D tilt + shine, adapted from the 3d-animations skill (perspective + preserve-3d, spring-smoothed).
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

export function TiltCard({
  children,
  className = "",
  max = 10,
  shine = true,
  depth = 30,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  shine?: boolean;
  depth?: number;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 260, damping: 26 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 260, damping: 26 });
  const sx = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const sy = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);
  const bg = useMotionTemplate`radial-gradient(circle at ${sx} ${sy}, rgba(255,255,255,0.35) 0%, transparent 55%)`;

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        className={`relative h-full ${className}`}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - r.left) / r.width - 0.5);
          y.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        <div style={{ transform: `translateZ(${depth}px)` }} className="h-full">{children}</div>
        {shine && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: bg }} />}
      </motion.div>
    </div>
  );
}
