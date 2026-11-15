"use client";
import { BellRing, CalendarDays, CircleCheck, Smartphone, Wallet } from "lucide-react";
import { Layer, ParallaxScene } from "@/components/motion/Parallax";

const appts = [
  { t: "09:00", n: "Akinyi W.", s: "Knotless braids", c: "from-brand-500 to-coral-500", h: "h-24" },
  { t: "10:30", n: "Mercy O.", s: "Gel manicure", c: "from-violet-500 to-fuchsia-500", h: "h-14" },
  { t: "11:15", n: "Joy K.", s: "Silk press", c: "from-amber-400 to-coral-500", h: "h-16" },
];

/** Layered product mock-up with mouse parallax depth (3d-animations skill). Illustrative UI, not real data. */
export function HeroVisual() {
  return (
    <ParallaxScene className="relative mx-auto h-[440px] w-full max-w-[540px]">
      <Layer depth={0.02} className="absolute inset-0">
        <div className="absolute top-8 right-4 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute bottom-0 left-6 h-56 w-56 rounded-full bg-coral-500/30 blur-3xl" />
      </Layer>

      <Layer depth={0.04} rotate className="absolute top-6 left-0 w-[78%]">
        <div className="rounded-3xl border border-white/10 bg-white/95 p-4 shadow-2xl shadow-black/40">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 font-display text-sm font-bold text-ink"><CalendarDays className="h-4 w-4 text-brand-600" /> Today</p>
            <span className="rounded-full bg-lime-glow px-2 py-0.5 text-[10px] font-bold text-plum-950">12 booked</span>
          </div>
          <div className="grid grid-cols-[40px_1fr] gap-2">
            {appts.map((a) => (
              <div key={a.t} className="contents">
                <span className="pt-1 text-[11px] font-semibold text-stone-400">{a.t}</span>
                <div className={`${a.h} rounded-xl bg-gradient-to-br ${a.c} p-2.5 text-white`}>
                  <p className="text-xs font-bold">{a.n}</p>
                  <p className="text-[11px] opacity-80">{a.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layer>

      <Layer depth={0.09} rotate className="absolute right-0 bottom-4 w-[46%]">
        <div className="rounded-[2rem] border-4 border-plum-800 bg-plum-950 p-3 shadow-2xl shadow-black/50">
          <div className="rounded-3xl bg-white p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500"><Smartphone className="h-3.5 w-3.5" /> Book online</p>
            <p className="mt-2 font-display text-sm font-bold text-ink">Gel manicure</p>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map((t, i) => (
                <span key={t} className={`rounded-lg py-1 text-center text-[10px] font-semibold ${i === 2 ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600"}`}>{t}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-emerald-500 py-2 text-[11px] font-bold text-white"><CircleCheck className="h-3.5 w-3.5" /> Booked!</div>
          </div>
        </div>
      </Layer>

      <Layer depth={0.14} className="absolute top-0 right-6">
        <div className="animate-float flex items-center gap-2 rounded-2xl bg-lime-glow px-3 py-2 text-xs font-bold text-plum-950 shadow-xl">
          <Wallet className="h-4 w-4" /> M-Pesa received · KES 1,500
        </div>
      </Layer>
      <Layer depth={0.12} className="absolute bottom-24 left-4">
        <div className="animate-float flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-ink shadow-xl [animation-delay:1.5s]">
          <BellRing className="h-4 w-4 text-brand-600" /> Reminder sent via WhatsApp
        </div>
      </Layer>
    </ParallaxScene>
  );
}
