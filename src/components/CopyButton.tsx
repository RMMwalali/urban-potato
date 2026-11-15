"use client";
import { useState } from "react";

export function CopyButton({ text, children, className }: { text: string; children: React.ReactNode; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch {}
      }}
    >
      {done ? "Copied!" : children}
    </button>
  );
}
