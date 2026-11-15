"use client";
// Hover/tap 3D flip card from the 3d-animations skill.
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

export function FlipCard({ front, back, className = "h-64" }: { front: React.ReactNode; back: React.ReactNode; className?: string }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  if (reduce)
    return (
      <div className={`grid gap-3 ${className.replace(/h-\S+/, "")}`}>
        {front}
        {back}
      </div>
    );
  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{ perspective: 1200 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>{front}</div>
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>{back}</div>
      </motion.div>
    </div>
  );
}
