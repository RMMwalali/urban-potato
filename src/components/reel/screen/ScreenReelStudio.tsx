"use client";
// Owner-centred demos on real screens. A laptop (the salon) and a phone (the client) sit side by side on a
// 3D stage, each running the real app in an iframe. The camera cuts between them and follows a mouse
// pointer (laptop) or a fingertip (phone) through complete workflows. No added text: only the app's own
// screens, with recorded interface sounds. Recorded with tab capture, cropped to the stage, one MP4 each.
import { useCallback, useEffect, useRef, useState } from "react";
import { scheduleScore } from "../score";
import { INTRO_HANDOFF, playIntro } from "./intro";
import { cardLength, playCard, type CardTile } from "./cards";

// The 3D tile shown beside each reel's hook: the moment that reel is about, as the product shows it.
const HOOK_TILE: Record<string, CardTile> = {
  landing: { icon: "sparkle", title: "Darling HQ", sub: "Booking · M-Pesa · Payroll", accent: "#e24a92" },
  booking: { icon: "calendar", title: "New booking", sub: "Sat · 2:30 pm · Box braids", accent: "#e24a92" },
  deposits: { icon: "wallet", title: "Deposit paid", sub: "KES 600 · M-Pesa", accent: "#22a06b" },
  checkout: { icon: "check", title: "M-Pesa confirmed", sub: "KES 4,500 · Safaricom", accent: "#22a06b" },
  clients: { icon: "users", title: "Returning client", sub: "Allergic to latex", accent: "#2b74c4" },
  dayend: { icon: "chart", title: "Today's takings", sub: "KES 18,300 · all matched", accent: "#2b74c4" },
  calendar: { icon: "calendar", title: "This week", sub: "36 bookings · 4 stylists", accent: "#2b74c4" },
  setup: { icon: "store", title: "Booking link", sub: "Live in minutes", accent: "#e24a92" },
  walkin: { icon: "receipt", title: "Walk-in · paid", sub: "Cash KES 1,200 · change 300", accent: "#1c1f24" },
  reminders: { icon: "bell", title: "Reminder sent", sub: "WhatsApp · tomorrow 10:00", accent: "#22a06b" },
  noshows: { icon: "x", title: "Cancelled in time", sub: "Slot free for someone else", accent: "#e24a92" },
  money: { icon: "wallet", title: "Pochi la Biashara", sub: "KES 2,300 · added from SMS", accent: "#22a06b" },
  team: { icon: "users", title: "Payslips ready", sub: "Commission + advances", accent: "#2b74c4" },
  phone: { icon: "phone", title: "On your phone", sub: "Bookings · checkout · alerts", accent: "#e24a92" },
  shopwindow: { icon: "store", title: "Your booking page", sub: "Photos · styles · prices", accent: "#e24a92" },
};
import { fill, fillTarget, REELS, type Dev, type Entry, type ReelDef, type ReelVars, type Step, type Target } from "./reels";
import { makeSfx, silentSfx, type Sfx, type TypingStyle } from "./sfx";
import { startFilming, stopFilming } from "@/app/actions/showcase";

const FORMATS = {
  portrait: { W: 1080, H: 1920, label: "9:16 vertical (TikTok, Reels, Shorts)", vw: 1100, vh: 1880, s0: 0.85, zoom: 1.6, phoneFit: 0.8 },
  landscape: { W: 1920, H: 1080, label: "16:9 (YouTube, website)", vw: 1440, vh: 880, s0: 0.98, zoom: 1.45, phoneFit: 0.86 },
} as const;
type Format = keyof typeof FORMATS;
const BAR = 46; // laptop browser chrome
const PV = { vw: 390, vh: 844, bezel: 16 }; // phone viewport and bezel
const GAP = 240; // space between the two devices on the stage
const FADE = 0.5, ENTER = 1.1, HOLD_END = 0.5, EXIT = 0.8;
const FPS = 30; // recording frame rate

type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number };
const REST: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
const ENTRIES: Record<Entry, Pose> = {
  rise: { x: 0, y: 900, z: -600, rx: 38, ry: 0, rz: 0 },
  drop: { x: 0, y: -900, z: -500, rx: -36, ry: 0, rz: 0 },
  "swing-left": { x: -1100, y: 0, z: -700, rx: 0, ry: -55, rz: 0 },
  "swing-right": { x: 1100, y: 0, z: -700, rx: 0, ry: 55, rz: 0 },
  push: { x: 0, y: 0, z: -2600, rx: 12, ry: -18, rz: 0 },
  spin: { x: 0, y: 200, z: -1400, rx: 10, ry: 0, rz: -14 },
};
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function nominal(st: Step): number {
  switch (st.do) {
    case "url": return 900 + 700 + (st.path.length + 20) * 55 + 1400;
    case "go": return 1500;
    case "nav": return 2400;
    case "move": return st.ms ?? 1000;
    case "click": return (st.ms ?? 950) + (st.nav ? 1500 : 450);
    case "type": return 850 + (st.text.length * 1000) / (st.cps ?? 13) + 250;
    case "set": return 1250;
    case "select": return 1350;
    case "submit": return 1500;
    case "scroll": return st.ms ?? 1100;
    case "swipe": return 1300;
    case "focus": return (st.ms ?? 2200) + 1300;
    case "read": return (st.ms ?? 3800) + 1700;
    case "shot": return st.ms ?? 1000;
    case "notify": return 2600;
    case "wait": return st.ms;
    case "waitFor": return 200;
    case "day": return 1700;
    case "file": return 2200;
  }
}
// Opening: 3D logo -> hook card (title + hook) -> what this video shows -> the demo. Closing: the address card.
const HOOK_HOLD = 2.9, ABOUT_HOLD = 3.4, URL_HOLD = 3.4;
const CARDS_AT = INTRO_HANDOFF + 0.1;
const ABOUT_AT = CARDS_AT + cardLength(2, HOOK_HOLD) - 0.25;
export const OPEN = ABOUT_AT + cardLength(1, ABOUT_HOLD) + 0.05; // the screens come in once the text has gone
const OUTRO = cardLength(3, URL_HOLD) + 0.3;
export const reelLength = (r: ReelDef) => OPEN + ENTER + OUTRO + r.steps.reduce((t, s) => t + nominal(s) / 1000, 0) + HOLD_END + EXIT;

function pickMime() {
  const avc = ["avc1.640028", "avc1.4D0028", "avc1.42E028", "avc1.42E01E"];
  const types = [...avc.flatMap((v) => [`video/mp4;codecs=${v},mp4a.40.2`, `video/mp4;codecs=${v},opus`]), "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

export function ScreenReelStudio({ name, initialReel, initialFormat, host }: { name: string; initialReel: string; initialFormat: Format; host: string }) {
  const [format, setFormat] = useState<Format>(initialFormat);
  const [reelId, setReelId] = useState(initialReel);
  const [music, setMusic] = useState(false);
  const [sound, setSound] = useState(true);
  const [typing, setTyping] = useState<TypingStyle>("typewriter");
  const [status, setStatus] = useState<"idle" | "playing" | "recording">("idle");
  const [msg, setMsg] = useState("");
  const [fit, setFit] = useState({ k: 0.5, dpr: 1 });
  const [panel, setPanel] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<HTMLIFrameElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const fxLayer = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLSpanElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // How far the captured picture trails real time (seconds). Sounds go straight into the file, so they're
  // delayed by this much to land exactly on the click, keystroke or toast they belong to.
  const captureLag = useRef(0);
  const stopRef = useRef(false);

  const reel = REELS.find((r) => r.id === reelId) ?? REELS[0];
  const usesPhone = !!reel.phone || reel.steps.some((s) => s.on === "phone");
  const tiltRef = useRef(reel.look.tilt);
  tiltRef.current = reel.look.tilt;
  const F = FORMATS[format];
  const { W, H, vw, vh, s0 } = F;

  // world layout: laptop at the origin, phone to its right, vertically centred
  const DW = vw, DH = vh + BAR;
  const PW = PV.vw + PV.bezel * 2, PH = PV.vh + PV.bezel * 2;
  const DEV = {
    desktop: { x: 0, y: 0, w: DW, h: DH, top: BAR, side: 0, vh, base: s0, zoom: F.zoom },
    phone: { x: DW + GAP, y: (DH - PH) / 2, w: PW, h: PH, top: PV.bezel, side: PV.bezel, vh: PV.vh, base: (H * F.phoneFit) / PH, zoom: 1.12 },
  };
  const worldW = usesPhone ? DW + GAP + PW : DW;
  const bothScale = Math.min((W * 0.92) / worldW, (H * 0.86) / Math.max(DH, PH));

  const active = useRef<Dev>("desktop");
  const shot = useRef<Dev | "both">("desktop");
  type CamState = { s: number; fx: number; fy: number };
  const goal = useRef<CamState>({ s: s0, fx: DW / 2, fy: DH / 2 });
  const cam = useRef<CamState>({ s: s0, fx: DW / 2, fy: DH / 2 });
  const cur = useRef({ x: DW * 0.62, y: DH * 0.55, press: 0, show: 0, touch: false });
  const curTw = useRef<{ from: { x: number; y: number }; to: { x: number; y: number }; t0: number; ms: number; bend: number } | null>(null);
  const follow = useRef(true);
  const pose = useRef<Pose>({ ...REST });
  const poseTw = useRef<{ from: Pose; to: Pose; t0: number; ms: number; ease: (x: number) => number } | null>(null);
  const blur = useRef(0);
  const sfx = useRef<Sfx>(silentSfx);
  const lastTyped = useRef<{ el: Element; text: string; dev: Dev } | null>(null);

  useEffect(() => {
    const onResize = () => setFit({ k: Math.min(window.innerWidth / W, window.innerHeight / H), dpr: window.devicePixelRatio || 1 });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [W, H]);

  useEffect(() => {
    goal.current = { s: s0, fx: DW / 2, fy: DH / 2 };
    cam.current = { ...goal.current };
  }, [s0, DW, DH]);

  useEffect(() => {
    let raf = 0, last = performance.now();
    const t0 = last;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ct = curTw.current;
      if (ct) {
        const p = Math.min(1, (now - ct.t0) / ct.ms), e = ease(p);
        const dx = ct.to.x - ct.from.x, dy = ct.to.y - ct.from.y;
        const cx = (ct.from.x + ct.to.x) / 2 - dy * ct.bend, cy = (ct.from.y + ct.to.y) / 2 + dx * ct.bend;
        cur.current.x = (1 - e) * (1 - e) * ct.from.x + 2 * (1 - e) * e * cx + e * e * ct.to.x;
        cur.current.y = (1 - e) * (1 - e) * ct.from.y + 2 * (1 - e) * e * cy + e * e * ct.to.y;
        if (p >= 1) curTw.current = null;
      }
      const pt = poseTw.current;
      if (pt) {
        const p = Math.min(1, (now - pt.t0) / pt.ms), e = pt.ease(p);
        (Object.keys(pose.current) as (keyof Pose)[]).forEach((k) => (pose.current[k] = pt.from[k] + (pt.to[k] - pt.from[k]) * e));
        if (p >= 1) poseTw.current = null;
      }
      blur.current = Math.max(0, blur.current - dt * 6);
      const g = goal.current;
      if (follow.current && shot.current !== "both") { g.fx = cur.current.x; g.fy = cur.current.y; }
      const c = cam.current, k = 1 - Math.exp(-dt * 2.6);
      c.s += (g.s - c.s) * k; c.fx += (g.fx - c.fx) * k; c.fy += (g.fy - c.fy) * k;
      // keep the frame on the device being shown
      let fx = c.fx, fy = c.fy;
      if (shot.current !== "both") {
        const d = DEV[shot.current];
        const halfW = W / 2 / c.s, halfH = H / 2 / c.s;
        fx = d.w <= halfW * 2 ? d.x + d.w / 2 : Math.max(d.x + halfW - 30, Math.min(d.x + d.w - halfW + 30, c.fx));
        fy = d.h <= halfH * 2 ? d.y + d.h / 2 : Math.max(d.y + halfH - 30, Math.min(d.y + d.h - halfH + 30, c.fy));
      }
      const t = (now - t0) / 1000;
      const tilt = tiltRef.current;
      const ref = shot.current === "both" ? { x: 0, w: worldW } : { x: DEV[shot.current].x, w: DEV[shot.current].w };
      const ry = (-(((fx - ref.x) / ref.w) - 0.5) * 10 + Math.sin(t * 0.35) * 1.2) * tilt;
      const rx = (4 + Math.cos(t * 0.3) * 0.8) * tilt;
      const P = pose.current;
      if (camRef.current) camRef.current.style.transform = `translate3d(${P.x}px, ${P.y}px, ${P.z}px) rotateX(${rx + P.rx}deg) rotateY(${ry + P.ry}deg) rotateZ(${P.rz}deg)`;
      if (rigRef.current) {
        rigRef.current.style.transform = `translate3d(${W / 2 - c.s * fx}px, ${H / 2 - c.s * fy}px, 0) scale(${c.s})`;
        rigRef.current.style.filter = blur.current > 0.05 ? `blur(${blur.current.toFixed(2)}px)` : "none";
      }
      const el = cursorRef.current;
      if (el) {
        const base = cur.current.touch ? DEV.phone.base * 1.1 : s0 * 1.25;
        el.style.transform = `translate3d(${cur.current.x}px, ${cur.current.y}px, 24px) scale(${(1 - cur.current.press * 0.2) * (base / c.s)})`;
        el.style.opacity = String(cur.current.show);
        el.dataset.touch = cur.current.touch ? "1" : "0";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H, DW, DH, s0, worldW]);

  /* ---------- the pages inside the devices ---------- */
  const frame = (d: Dev) => (d === "phone" ? phoneRef.current : deskRef.current);
  const win = (d: Dev = active.current) => frame(d)?.contentWindow ?? null;
  const doc = (d: Dev = active.current) => frame(d)?.contentDocument ?? null;
  const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  const find = useCallback((t: Target, d: Dev = active.current): Element | null => {
    const dc = doc(d);
    if (!dc) return null;
    const root: ParentNode = (t.within && dc.querySelector(t.within)) || dc;
    let list: Element[] = [];
    if (t.field) {
      const want = norm(t.field);
      for (const l of root.querySelectorAll("label")) {
        if (!norm(l.textContent ?? "").startsWith(want)) continue;
        const ctl = (l.htmlFor && dc.getElementById(l.htmlFor)) || l.parentElement?.querySelector("input:not([type=hidden]),select,textarea");
        if (ctl && visible(ctl)) list.push(ctl);
      }
    } else if (t.text) {
      const want = norm(t.text);
      const pool = [...root.querySelectorAll(t.sel ?? "a,button,label,h1,h2,h3,h4,p,span,b,td,th,li,dt,dd,summary,div")].filter((el) => visible(el) && norm((el as HTMLElement).innerText ?? el.textContent ?? "").includes(want));
      list = pool.filter((el) => !pool.some((o) => o !== el && el.contains(o)));
    } else if (t.sel) {
      list = [...root.querySelectorAll(t.sel)].filter(visible);
    }
    return list[t.nth ?? 0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waitFind = useCallback(async (t: Target, ms = 8000, d: Dev = active.current) => {
    const end = performance.now() + ms;
    for (;;) {
      const el = find(t, d);
      if (el) return el;
      if (performance.now() > end || stopRef.current) throw new Error(`Couldn't find ${JSON.stringify(t)} on the ${d} at ${win(d)?.location.pathname}`);
      await sleep(120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [find]);

  // element position in world coordinates
  const box = (el: Element, d: Dev = active.current) => {
    const r = el.getBoundingClientRect(), o = DEV[d];
    const x = o.x + o.side + r.left, y = o.y + o.top + r.top;
    return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
  };

  const glide = async (to: { x: number; y: number }, ms: number) => {
    cur.current.show = 1;
    const dist = Math.hypot(to.x - cur.current.x, to.y - cur.current.y);
    const dur = Math.max(380, Math.min(ms, 260 + dist * 0.9));
    curTw.current = { from: { x: cur.current.x, y: cur.current.y }, to, t0: performance.now(), ms: dur, bend: (Math.random() - 0.5) * 0.3 };
    await sleep(dur + 60);
  };

  const reveal = async (el: Element, d: Dev = active.current, ms = 850) => {
    const w = win(d);
    if (!w) return;
    const r = el.getBoundingClientRect(), v = DEV[d].vh;
    if (r.top > 90 && r.bottom < v - 90) return;
    w.scrollTo({ top: w.scrollY + r.top - v * 0.32, behavior: "smooth" });
    await sleep(ms);
  };

  // switch which device the pointer works on (a fingertip on the phone, a mouse on the laptop)
  const useDevice = (d: Dev) => {
    if (active.current === d) return;
    active.current = d;
    const o = DEV[d];
    cur.current = { ...cur.current, x: o.x + o.w * 0.6, y: o.y + o.h * 0.62, touch: d === "phone", show: 0 };
  };

  const frameShot = (view: Dev | "both", zoomed = false) => {
    shot.current = view;
    if (view === "both") { follow.current = false; goal.current = { s: bothScale, fx: worldW / 2, fy: DH / 2 }; return; }
    const o = DEV[view];
    goal.current = { s: o.base * (zoomed ? o.zoom : 1), fx: o.x + o.w / 2, fy: o.y + o.h * 0.45 };
  };

  const moveTo = async (el: Element, ms = 950) => {
    const d = active.current;
    if (shot.current !== d) { sfx.current.swap(d === "phone" ? "in" : "out"); frameShot(d); blur.current = 2; await sleep(500); }
    await reveal(el);
    const b = box(el);
    goal.current.s = DEV[d].base * DEV[d].zoom;
    follow.current = true;
    await glide({ x: Math.min(b.cx, b.x + Math.min(b.w * 0.5, 150)), y: b.cy }, ms);
  };

  const press = async () => {
    cur.current.press = 1;
    sfx.current.click(active.current);
    const layer = fxLayer.current;
    if (layer) {
      const ring = document.createElement("div");
      ring.className = cur.current.touch ? "reel-ripple touch" : "reel-ripple";
      ring.style.left = `${cur.current.x}px`; ring.style.top = `${cur.current.y}px`;
      layer.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    }
    await sleep(170);
    cur.current.press = 0;
  };

  const setValue = (el: Element, v: string) => {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
    setter?.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Inside the demo: "Are you sure?" is always yes, and printing doesn't open a dialog.
  const tame = (d: Dev = active.current) => {
    try {
      const w = win(d) as (Window & { __reel?: boolean; __reelHold?: boolean }) | null;
      if (w && !w.__reel) { w.confirm = () => true; w.alert = () => {}; w.print = () => {}; w.__reel = true; w.__reelHold = true; }
    } catch {}
  };
  const syncUrl = () => { try { if (urlRef.current) urlRef.current.textContent = `${host}${win("desktop")?.location.pathname ?? ""}${win("desktop")?.location.search ?? ""}`; } catch {} };

  const settle = async (before: string) => {
    const end = performance.now() + 9000;
    while (performance.now() < end && !stopRef.current) {
      const href = win()?.location.href;
      if (href && href !== before && doc()?.readyState === "complete") break;
      await sleep(100);
    }
    await sleep(300);
    syncUrl(); tame();
  };

  // page change: pull back a little, scale-punch with a touch of motion blur and a soft page sound
  const pullBack = () => {
    const o = DEV[active.current];
    follow.current = false;
    shot.current = active.current;
    goal.current = { s: o.base * (1 + (o.zoom - 1) * 0.3), fx: o.x + o.w / 2, fy: o.y + o.h * 0.42 };
    cam.current.s *= 1.06;
    blur.current = 2.2;
    sfx.current.page();
  };

  // wait until an element stops moving or growing (a slip still printing, a panel still opening)
  const still = async (el: Element, max = 3500) => {
    let last = "", still = 0;
    const end = performance.now() + max;
    while (performance.now() < end && still < 4) {
      const r = el.getBoundingClientRect(), k = `${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
      still = k === last ? still + 1 : 0; last = k;
      await sleep(100);
    }
  };

  // dim the page around an element without touching the element itself (safe inside any stacking context)
  const cutout = (target: HTMLElement) => {
    const dc = target.ownerDocument, r = target.getBoundingClientRect();
    const hole = dc.createElement("div");
    hole.style.cssText = `position:fixed;left:${r.left - 8}px;top:${r.top - 8}px;width:${r.width + 16}px;height:${r.height + 16}px;z-index:2147483000;pointer-events:none;border-radius:6px;box-shadow:0 0 0 200vmax rgba(18,20,24,0.42);opacity:0;transition:opacity .45s ease`;
    dc.body.appendChild(hole);
    requestAnimationFrame(() => { hole.style.opacity = "1"; });
    return async () => { hole.style.opacity = "0"; await sleep(450); hole.remove(); };
  };

  /**
   * Give the viewer time to take something in: wait for it to finish appearing, frame the whole of it as
   * large as it will go, put the pointer away, and hold. Anything taller than the frame is read top to bottom.
   */
  const readOn = async (el: Element, ms: number) => {
    const d = active.current, o = DEV[d], w = win(d);
    if (shot.current !== d) { sfx.current.swap(d === "phone" ? "in" : "out"); frameShot(d); blur.current = 2; await sleep(500); }
    await still(el);
    // bring it into the page's viewport: the top of it when it's tall, the middle otherwise
    if (w) {
      const r = el.getBoundingClientRect();
      const want = r.height > o.vh * 0.8 ? r.top - 24 : r.top + r.height / 2 - o.vh / 2;
      if (r.top < 0 || r.bottom > o.vh || r.height > o.vh * 0.8) { w.scrollTo({ top: w.scrollY + want, behavior: "smooth" }); await sleep(800); }
    }
    cur.current.show = 0;
    follow.current = false;
    const b = box(el, d);
    const cap = o.base * o.zoom * 1.4;
    const fitW = (W * 0.86) / b.w, fitH = (H * 0.78) / b.h;
    const s = Math.max(o.base * 0.9, Math.min(cap, fitW, Math.max(fitH, o.base)));
    const viewH = (H * 0.86) / s;
    const tall = b.h > viewH;
    goal.current = { s, fx: b.cx, fy: tall ? b.y + viewH / 2 : b.cy };
    const restore = cutout(el as HTMLElement);
    sfx.current.pop();
    await sleep(900);
    if (tall) {
      // a slow, even scan down the content, with a moment at the top and at the bottom
      const from = b.y + viewH / 2, to = b.y + b.h - viewH / 2, t0 = performance.now(), dur = ms * 0.7;
      await sleep(ms * 0.15);
      while (performance.now() - t0 < dur) { goal.current.fy = from + (to - from) * ease((performance.now() - t0) / dur); await sleep(16); }
      goal.current.fy = to;
      await sleep(ms * 0.15);
    } else await sleep(ms);
    await restore();
    cur.current = { ...cur.current, x: b.cx, y: b.y + b.h + 40 };
    follow.current = true;
  };

  const focusOn = async (el: Element, ms: number) => {
    const d = active.current, dc = doc();
    await still(el, 2500);
    await reveal(el);
    const vwPx = dc?.defaultView?.innerWidth ?? DEV[d].w;
    let target = el as HTMLElement;
    for (let n: HTMLElement | null = target; n && n !== dc?.body; n = n.parentElement) {
      const r = n.getBoundingClientRect();
      if (r.width > vwPx * 0.86 || r.height > DEV[d].vh * 0.6) break;
      target = n;
      if (r.height >= 56 && /^(DIV|SECTION|TR|LI|FORM|ARTICLE)$/.test(n.tagName)) break;
    }
    const b = box(target);
    follow.current = false;
    goal.current = { s: DEV[d].base * DEV[d].zoom * 1.12, fx: b.cx, fy: b.cy };
    await glide({ x: Math.min(b.cx + 40, b.x + b.w - 10), y: b.cy + Math.min(30, b.h / 2) }, 600);
    if (!dc) return;
    const restore = cutout(target);
    sfx.current.pop();
    await sleep(ms);
    await restore();
    follow.current = true;
  };

  const load = useCallback(async (d: Dev, path: string) => {
    const f = frame(d);
    if (!f) return;
    await new Promise<void>((res) => {
      const done = () => { f.removeEventListener("load", done); res(); };
      f.addEventListener("load", done);
      f.src = path;
      setTimeout(done, 9000);
    });
    if (d === "desktop") syncUrl();
    tame(d);
    await sleep(200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function typeInto(el: Element, text: string, cps: number) {
    (el as HTMLElement).focus();
    lastTyped.current = { el, text, dev: active.current };
    for (let i = 1; i <= text.length && !stopRef.current; i++) {
      setValue(el, text.slice(0, i));
      sfx.current.key(text[i - 1], active.current);
      await sleep((1000 / cps) * (0.65 + Math.random() * 0.7));
    }
  }

  async function runStep(st: Step, v: ReelVars) {
    useDevice(st.on ?? (st.do === "shot" ? active.current : "desktop"));
    switch (st.do) {
      case "shot": {
        if (shot.current !== st.view) { sfx.current.swap(st.view === "desktop" ? "out" : "in"); blur.current = 2.4; }
        frameShot(st.view);
        if (st.view !== "both") useDevice(st.view);
        return;
      }
      case "url": {
        const bar = urlRef.current!;
        frameShot("desktop");
        await glide({ x: 140 + Math.min(bar.offsetWidth, 520) * 0.5, y: BAR / 2 }, 900);
        goal.current = { s: s0 * (1 + (F.zoom - 1) * 0.5), fx: DW * 0.3, fy: BAR + 120 }; follow.current = false;
        await press();
        bar.classList.add("selected"); await sleep(450); bar.classList.remove("selected");
        const full = `${host}${fill(st.path, v)}`;
        for (let i = 1; i <= full.length && !stopRef.current; i++) { bar.textContent = full.slice(0, i); if (i > host.length) sfx.current.key(full[i - 1], "desktop"); await sleep(i <= host.length ? 18 : 55); }
        sfx.current.enter("desktop");
        await sleep(250);
        pullBack();
        await load("desktop", fill(st.path, v));
        return;
      }
      case "go": { pullBack(); await load(active.current, fill(st.path, v)); return; }
      case "nav": {
        const el = await waitFind({ text: st.label, sel: '[data-tour="nav"] a' });
        await moveTo(el, 900);
        const before = win()?.location.href ?? "";
        await press(); tame(); (el as HTMLElement).click();
        pullBack();
        await settle(before);
        return;
      }
      case "move": { await moveTo(await waitFind(fillTarget(st.to, v)), st.ms); return; }
      case "click": {
        const el = await waitFind(fillTarget(st.to, v));
        await moveTo(el, st.ms ?? 950);
        const before = win()?.location.href ?? "";
        await press(); tame(); (el as HTMLElement).click();
        if (st.nav) { pullBack(); await settle(before); }
        return;
      }
      case "type": {
        const el = await waitFind(fillTarget(st.to, v));
        await moveTo(el, 800);
        await press();
        await typeInto(el, fill(st.text, v), st.cps ?? (active.current === "phone" ? 9 : 13));
        return;
      }
      case "set": {
        const el = await waitFind(fillTarget(st.to, v));
        await moveTo(el, 800);
        await press();
        (el as HTMLElement).focus();
        await sleep(200);
        setValue(el, fill(st.value, v));
        return;
      }
      case "select": {
        const el = (await waitFind(fillTarget(st.to, v))) as HTMLSelectElement;
        await moveTo(el, 800);
        await press();
        await sleep(250);
        const opt = [...el.options].find((o) => norm(o.text).startsWith(norm(fill(st.option, v))));
        if (opt) setValue(el, opt.value);
        return;
      }
      case "submit": {
        const el = await waitFind(fillTarget(st.to, v));
        const before = win()?.location.href ?? "";
        sfx.current.enter(active.current);
        (el as HTMLInputElement).form?.requestSubmit();
        pullBack();
        await settle(before);
        return;
      }
      case "scroll": {
        const el = await waitFind(fillTarget(st.to, v));
        follow.current = false;
        frameShot(active.current);
        await reveal(el, active.current, st.ms ?? 850);
        follow.current = true;
        return;
      }
      case "swipe": {
        // a fingertip drags the carousel sideways
        const rail = (await waitFind(fillTarget(st.to, v))) as HTMLElement;
        await moveTo(rail, 600);
        const b = box(rail);
        const from = { x: st.dx > 0 ? b.x + b.w * 0.75 : b.x + b.w * 0.25, y: b.cy };
        await glide(from, 400);
        cur.current.press = 1;
        sfx.current.click(active.current);
        rail.scrollBy({ left: st.dx, behavior: "smooth" });
        await glide({ x: from.x - Math.sign(st.dx) * b.w * 0.45, y: b.cy - 6 }, 520);
        cur.current.press = 0;
        await sleep(350);
        return;
      }
      case "notify": {
        // the salon's laptop checks for news right away (normally every few seconds)
        frameShot("desktop");
        const d = "desktop" as Dev;
        let toast: Element | null = null;
        for (let i = 0; i < 8 && !toast && !stopRef.current; i++) {
          win(d)?.dispatchEvent(new Event("darling:read"));
          await sleep(700);
          toast = find({ sel: ".toast-in" }, d);
        }
        if (!toast) throw new Error("The notification didn't arrive on the laptop.");
        sfx.current.notify(st.kind);
        const b = box(toast, d);
        follow.current = false;
        goal.current = { s: DEV.desktop.base * DEV.desktop.zoom * 1.1, fx: b.cx - 120, fy: b.cy + 60 };
        await sleep(900);
        return;
      }
      case "wait": return;
      case "waitFor": {
        try { await waitFind(fillTarget(st.to, v), st.ms ?? 9000); }
        catch (err) {
          let lt = lastTyped.current;
          if (!lt || !lt.el.isConnected) {
            const code = find({ sel: 'input[aria-label="M-Pesa code"]' }) as HTMLInputElement | null;
            lt = code?.value ? { el: code, text: code.value, dev: active.current } : null;
          }
          if (!lt) throw err;
          setValue(lt.el, ""); await sleep(150); setValue(lt.el, lt.text);
          await waitFind(fillTarget(st.to, v), 8000);
        }
        return;
      }
      case "file": {
        const el = await waitFind(fillTarget(st.to, v));
        await moveTo(el, 800);
        await press();
        const w = win() as (Window & typeof globalThis) | null;
        const input = doc()?.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement | null;
        if (!w || !input) return;
        const dt = new w.DataTransfer();
        const pal = ["#d9468a", "#1f5277", "#f5d6e4", "#4f9cf0", "#1c1f24", "#ededed", "#f06fae"];
        for (let k = 0; k < (st.count ?? 1); k++) {
          const c = document.createElement("canvas"); c.width = 800; c.height = 1000;
          const g = c.getContext("2d")!;
          g.fillStyle = pal[(k * 3) % pal.length]; g.fillRect(0, 0, 800, 1000);
          for (let n = 0; n < 8; n++) { g.globalAlpha = 0.5 + Math.random() * 0.5; g.fillStyle = pal[Math.floor(Math.random() * pal.length)]; g.beginPath(); g.arc(Math.random() * 800, Math.random() * 1000, 80 + Math.random() * 280, 0, Math.PI * 2); g.fill(); }
          const blob = await new Promise<Blob>((res) => c.toBlob((x) => res(x!), "image/png"));
          dt.items.add(new w.File([new Uint8Array(await blob.arrayBuffer())], `photo-${k + 1}.png`, { type: "image/png" }));
        }
        input.files = dt.files;
        input.dispatchEvent(new w.Event("change", { bubbles: true }));
        return;
      }
      case "day": {
        for (let i = st.from; i < st.from + 10 && !stopRef.current; i++) {
          const day = find({ sel: "[data-days] button", nth: i });
          if (!day) break;
          await moveTo(day, 650);
          await press(); (day as HTMLElement).click();
          const end = performance.now() + 2500;
          while (performance.now() < end) {
            await sleep(120);
            if (find({ sel: ".grid-cols-4 button" })) return;
            if (find({ text: "No free times" })) break;
          }
        }
        await waitFind({ sel: ".grid-cols-4 button" }, 3000);
        return;
      }
      case "focus": { await focusOn(await waitFind(fillTarget(st.to, v)), st.ms ?? 2200); return; }
      case "read": { await readOn(await waitFind(fillTarget(st.to, v), 12000), st.ms ?? 3800); return; }
    }
  }

  async function play(r: ReelDef, v: ReelVars, onStart: (len: number) => void) {
    lastTyped.current = null;
    const curtain = curtainRef.current!;
    curtain.style.transition = "none"; curtain.style.opacity = "1";
    curtain.style.backgroundColor = "#ffffff"; // the opening and the end card are always on white
    if (fxLayer.current) fxLayer.current.innerHTML = "";
    // the app's own notification sounds stay off while filming (the demo plays recorded ones)
    try { localStorage.setItem("darling.sound", JSON.stringify({ sound: false, volume: 0.8 })); } catch {}
    await Promise.all([load("desktop", fill(r.start, v)), r.phone ? load("phone", fill(r.phone, v)) : Promise.resolve()]);
    active.current = "desktop"; shot.current = "desktop";
    const first = r.steps.find((s) => s.do === "shot") as { view: Dev | "both" } | undefined;
    frameShot(first && r.steps.indexOf(first as Step) === 0 ? first.view : "desktop");
    cam.current = { ...goal.current };
    follow.current = false;
    cur.current = { x: DW * 0.62, y: DH * 0.55, press: 0, show: 1, touch: false };
    await sleep(300);

    const plan: number[] = [];
    let acc = OPEN + ENTER;
    for (const st of r.steps) { acc += nominal(st) / 1000; plan.push(acc); }
    const length = acc + HOLD_END + EXIT + OUTRO;
    const start = performance.now();
    const at = (s: number) => sleep(Math.max(0, start + s * 1000 - performance.now()));
    onStart(length);

    // 1. the 3D wordmark
    pose.current = { ...ENTRIES[r.look.entry] };
    const light = true; // cards are on white
    const base = Math.min(W * 0.092, H * 0.11);
    const intro = introRef.current ? playIntro(introRef.current, { name, light, W, H, spin: r.look.entry === "swing-left" || r.look.entry === "spin" ? -1 : 1, sfx: sfx.current }) : Promise.resolve();
    // 2. the hook: the problem, in the owner's words, under the video's title
    await at(CARDS_AT);
    const card = cardRef.current;
    if (card) void playCard(card, [
      { text: r.title, size: Math.round(base * 0.34), caps: true, tone: "pink", track: 0.06 },
      { text: r.hook, size: Math.round(base * 1.02), weight: 500, gap: Math.round(base * 0.35) },
    ], { light, W, H, hold: HOOK_HOLD, sfx: sfx.current, tile: HOOK_TILE[r.id], white: true });
    // 3. what Darling HQ does about it, which is what the demo shows
    await at(ABOUT_AT);
    if (card) void playCard(card, [
      { text: fill(r.about, { ...v }).replace(/\{name\}/g, name), size: Math.round(base * 0.74), tone: "ink" },
    ], { light, W, H, hold: ABOUT_HOLD, white: true });
    // 4. the screens come through
    await at(OPEN);
    poseTw.current = { from: { ...pose.current }, to: { ...REST }, t0: performance.now(), ms: ENTER * 1000, ease: outExpo };
    curtain.style.transition = `opacity ${FADE}s ease`; curtain.style.opacity = "0";
    setTimeout(() => sfx.current.hit(), ENTER * 450);
    await intro;
    await at(OPEN + ENTER * 0.7);
    let late = 0; // seconds the steps have run over; holds that follow are never shortened to make up for it
    for (let i = 0; i < r.steps.length && !stopRef.current; i++) {
      const t1 = performance.now();
      await runStep(r.steps[i], v);
      const took = (performance.now() - t1) / 1000, budget = nominal(r.steps[i]) / 1000;
      if (took > budget + 1.5) console.info(`reel ${r.id}: step ${i} (${r.steps[i].do}) took ${took.toFixed(1)}s, planned ${budget.toFixed(1)}s`);
      late = Math.max(late, (performance.now() - start) / 1000 - plan[i]);
      await at(plan[i] + late);
    }
    console.info(`reel ${r.id}: planned ${acc.toFixed(1)}s, ran ${late.toFixed(1)}s over`);
    await at(acc + late + HOLD_END);
    const out = ENTRIES[r.look.entry];
    poseTw.current = { from: { ...pose.current }, to: { x: -out.x * 0.6, y: -out.y * 0.6, z: out.z * 0.8, rx: -out.rx * 0.6, ry: -out.ry * 0.6, rz: -out.rz }, t0: performance.now(), ms: EXIT * 1000, ease: (x) => x * x * x };
    sfx.current.whoosh(0.6);
    follow.current = false;
    cur.current.show = 0;
    curtain.style.transition = `opacity ${EXIT * 0.8}s ease ${EXIT * 0.2}s`; curtain.style.opacity = "1";
    // 5. where to find it
    await at(acc + late + HOLD_END + EXIT);
    const site = host.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    if (cardRef.current) await playCard(cardRef.current, [
      { text: name, brand: true, size: Math.round(base * 0.9), caps: true, weight: 600, track: -0.02 },
      { text: site, size: Math.round(Math.min(base * 1.1, (W * 0.84) / Math.max(8, site.length) * 1.75)), weight: 500, gap: Math.round(base * 0.45) },
      { text: "Try it free for 14 days", size: Math.round(base * 0.46), tone: "muted", gap: Math.round(base * 0.3) },
    ], { light, W, H, hold: URL_HOLD, align: "center", sfx: sfx.current, white: true });
    await at(length + late);
    pose.current = { ...REST };
  }

  async function freshVars(): Promise<ReelVars | null> {
    const v = await startFilming();
    if ("error" in v) { setMsg(v.error); return null; }
    return v;
  }

  async function withAudio(fn: (begin: (len: number) => void, dest: MediaStreamAudioDestinationNode) => Promise<void>) {
    const actx = new AudioContext({ sampleRate: 48000 });
    await actx.resume();
    const dest = actx.createMediaStreamDestination();
    const out = actx.createGain();
    const lag = actx.createDelay(1);
    lag.delayTime.value = Math.min(0.5, Math.max(0, captureLag.current));
    out.connect(actx.destination); out.connect(lag).connect(dest);
    const musicBus = actx.createGain();
    musicBus.gain.value = 0.22; // music sits well under the interface sounds
    musicBus.connect(out);
    sfx.current = sound ? await makeSfx(actx, out, typing) : silentSfx;
    try {
      await fn((len) => { if (music) scheduleScore(actx, musicBus, actx.currentTime + 0.02, [], len * 1.06 + 1, len * 1.06 - 1.4); }, dest);
    } finally {
      sfx.current = silentSfx;
      await actx.close();
    }
  }

  async function preview() {
    captureLag.current = 0; // nothing is captured in a preview
    setMsg(""); stopRef.current = false; setStatus("playing"); setPanel(false);
    try {
      const v = await freshVars();
      if (v) await withAudio((begin) => play(reel, v, begin));
    } catch (e) { setMsg((e as Error).message); }
    setStatus("idle"); setPanel(true);
  }

  async function record(list: ReelDef[]) {
    setMsg(""); stopRef.current = false;
    const mime = pickMime();
    if (!mime || !navigator.mediaDevices?.getDisplayMedia) { setMsg("Recording needs Chrome or Edge on a computer."); return; }
    let screen: MediaStream;
    try {
      screen = await navigator.mediaDevices.getDisplayMedia({
        // A steady 30 fps at about the size we keep. Asking for 4K at 60 fps makes the encoder fall behind
        // on most laptops, and the backlog shows up as stutter and freezes later in a long take.
        video: { displaySurface: "browser", frameRate: { ideal: FPS, max: FPS }, width: { ideal: Math.max(window.screen.width, W) * (window.devicePixelRatio || 1) }, height: { ideal: Math.max(window.screen.height, H) * (window.devicePixelRatio || 1) } },
        audio: false, preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude",
      } as DisplayMediaStreamOptions);
    } catch { setMsg("Recording was cancelled. Choose “This tab” when the browser asks."); return; }
    setStatus("recording"); setPanel(false);
    const track = screen.getVideoTracks()[0];
    let cropped = false;
    try {
      const CT = (window as unknown as { CropTarget?: { fromElement(e: Element): Promise<unknown> } }).CropTarget;
      if (CT && "cropTo" in track) { await (track as unknown as { cropTo(t: unknown): Promise<void> }).cropTo(await CT.fromElement(stageRef.current!)); cropped = true; }
    } catch { cropped = false; }
    // The captured tab plays in a (hidden but attached) video; a detached one can be paused by the browser.
    const video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.srcObject = screen;
    video.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
    document.body.appendChild(video);
    await video.play();
    await sleep(600);
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const oc = out.getContext("2d", { alpha: false, desynchronized: true })!;
    oc.imageSmoothingQuality = "high";
    // One output frame per captured frame, pushed by hand, so frames are never doubled or skipped.
    const canvasTrack = out.captureStream(0).getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    let drawing = true, lastFrame = 0;
    const paint = () => {
      // after a busy moment the browser can hand over captured frames in a burst; frames closer together than
      // this get the same timestamp in the file, and players stutter on them
      const now = performance.now();
      if (!video.videoWidth || now - lastFrame < 1000 / FPS * 0.6) return;
      lastFrame = now;
      if (cropped) oc.drawImage(video, 0, 0, W, H);
      else {
        const r = stageRef.current!.getBoundingClientRect();
        const sx = video.videoWidth / window.innerWidth, sy = video.videoHeight / window.innerHeight;
        oc.drawImage(video, r.left * sx, r.top * sy, r.width * sx, r.height * sy, 0, 0, W, H);
      }
      canvasTrack.requestFrame();
    };
    type FrameMeta = { captureTime?: number; expectedDisplayTime?: number };
    const v2 = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: (now: number, m: FrameMeta) => void) => number };
    const lags: number[] = [];
    captureLag.current = 0.1; // typical for tab capture, until measured
    if (v2.requestVideoFrameCallback) {
      const onFrame = (_: number, m: FrameMeta) => {
        if (!drawing) return;
        // the frame shows the page as it was at captureTime (plus one display frame before that)
        if (m.captureTime) { lags.push((performance.now() - m.captureTime) / 1000 + 1 / 60); if (lags.length > 90) lags.shift(); }
        paint();
        v2.requestVideoFrameCallback!(onFrame);
      };
      v2.requestVideoFrameCallback(onFrame);
    } else {
      const tick = () => { if (!drawing) return; paint(); setTimeout(tick, 1000 / FPS); };
      tick();
    }
    try {
      for (const r of list) {
        if (stopRef.current) break;
        setReelId(r.id);
        await sleep(500);
        const v = await freshVars();
        if (!v) break;
        if (lags.length >= 10) { const xs = [...lags].sort((a, b) => a - b); captureLag.current = xs[Math.floor(xs.length / 2)]; }
        console.info(`capture lag ${(captureLag.current * 1000).toFixed(0)} ms (${lags.length} frames measured)`);
        await withAudio(async (begin, dest) => {
          const chunks: Blob[] = [];
          const withSound = music || sound;
          const tracks = [canvasTrack, ...(withSound ? dest.stream.getAudioTracks() : [])];
          // 10 Mbit/s is plenty for 1080p at 30 fps and keeps the encoder comfortably ahead
          const rec = new MediaRecorder(new MediaStream(tracks), { mimeType: withSound ? mime : mime.replace(/,(mp4a\.40\.2|opus)/, ""), videoBitsPerSecond: 10_000_000, audioBitsPerSecond: 192_000 });
          rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
          let started = false;
          await play(r, v, (len) => { if (!started) { rec.start(1000); started = true; } begin(len); });
          await sleep(200);
          const stopped = new Promise<void>((res) => (rec.onstop = () => res()));
          rec.stop(); await stopped;
          if (!stopRef.current) {
            const type = mime.split(";")[0];
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob(chunks, { type }));
            a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-${r.id}-${format}.${type.includes("mp4") ? "mp4" : "webm"}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
          }
          chunks.length = 0;
        });
      }
    } catch (e) { setMsg((e as Error).message); }
    drawing = false;
    canvasTrack.stop();
    video.srcObject = null; video.remove();
    screen.getTracks().forEach((t) => t.stop());
    setStatus("idle"); setPanel(true);
  }

  async function done() {
    stopRef.current = true;
    try { localStorage.removeItem("darling.sound"); } catch {}
    await stopFilming();
    window.location.href = "/admin/reel";
  }

  const capW = Math.round(W * fit.k * fit.dpr), capH = Math.round(H * fit.k * fit.dpr);
  const busy = status !== "idle";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div ref={stageRef} className={`reel-stage absolute left-1/2 top-1/2 overflow-hidden ${reel.look.light ? "light" : ""}`} style={{ width: W, height: H, background: reel.look.bg, transform: `translate(-50%, -50%) scale(${fit.k})`, perspective: format === "portrait" ? 3200 : 3600 }}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07] mix-blend-overlay" aria-hidden><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#grain)" /></svg>
        <div ref={camRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "50% 50%" }}>
          <div ref={rigRef} className="absolute left-0 top-0" style={{ width: worldW, height: DH, transformOrigin: "0 0", transformStyle: "preserve-3d" }}>
            {/* the salon's laptop */}
            <div className="reel-device absolute" style={{ left: DEV.desktop.x, top: DEV.desktop.y, width: DW, height: DH }}>
              <div className="reel-chrome" style={{ height: BAR }}><i /><i /><i /><span ref={urlRef} className="reel-url">{host}</span></div>
              <iframe ref={deskRef} title={`${name} on a laptop`} className="absolute bg-paper" style={{ left: 0, top: BAR, width: vw, height: vh, border: 0 }} />
            </div>
            {/* the client's phone */}
            {usesPhone && (
              <div className="reel-phone absolute" style={{ left: DEV.phone.x, top: DEV.phone.y, width: PW, height: PH }}>
                <iframe ref={phoneRef} title={`${name} on a phone`} className="absolute bg-paper" style={{ left: PV.bezel, top: PV.bezel, width: PV.vw, height: PV.vh, border: 0, borderRadius: 38 }} />
                <span className="reel-island" />
              </div>
            )}
            <div ref={fxLayer} className="absolute inset-0" style={{ transformStyle: "preserve-3d", pointerEvents: "none" }} />
            <div ref={cursorRef} className="reel-cursor" style={{ opacity: 0 }}>
              <svg className="reel-arrow" width="30" height="40" viewBox="0 0 34 46" aria-hidden><path d="M2 2 L2 36 L11 28 L17 43 L23 40 L17 26 L30 26 Z" fill="#fff" stroke="#1c1f24" strokeWidth="2.6" strokeLinejoin="round" /></svg>
              <span className="reel-touch" />
            </div>
          </div>
        </div>
        <div ref={curtainRef} className="absolute inset-0" style={{ opacity: 1, backgroundColor: reel.look.bg }} />
        <div ref={introRef} className="pointer-events-none absolute inset-0" />
        <div ref={cardRef} className="pointer-events-none absolute inset-0" />
      </div>

      {/* controls (outside the recorded stage) */}
      <div className={`fixed left-4 top-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] border border-white/20 bg-black/80 p-5 text-[13px] text-white backdrop-blur transition-opacity duration-500 ${panel ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <p className="label-caps text-white/60">Demos · {name}</p>
        <div className="mt-4 space-y-3">
          <select value={reelId} onChange={(e) => setReelId(e.target.value)} disabled={busy} className="w-full border border-white/30 bg-black px-3 py-2">
            {REELS.map((r, i) => <option key={r.id} value={r.id}>{String(i + 1).padStart(2, "0")} · {r.title} (~{Math.round(reelLength(r))}s)</option>)}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value as Format)} disabled={busy} className="w-full border border-white/30 bg-black px-3 py-2">
            {Object.entries(FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-white/80"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} disabled={busy} /> Sounds (recorded typing, clicks, taps, whooshes)</label>
          {sound && (
            <select value={typing} onChange={(e) => setTyping(e.target.value as TypingStyle)} disabled={busy} className="w-full border border-white/30 bg-black px-3 py-2">
              <option value="typewriter">Typing sound: typewriter</option>
              <option value="keyboard">Typing sound: laptop keyboard</option>
            </select>
          )}
          <label className="flex items-center gap-2 text-white/80"><input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} disabled={busy} /> Background music (built-in score, low)</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={preview} disabled={busy} className="border border-white px-3 py-2 uppercase tracking-[0.06em] hover:bg-white hover:text-black disabled:opacity-40">Preview</button>
            <button onClick={() => record([reel])} disabled={busy} className="bg-white px-3 py-2 uppercase tracking-[0.06em] text-black hover:opacity-80 disabled:opacity-40">Record</button>
            <button onClick={() => record(REELS)} disabled={busy} className="col-span-2 border border-white/40 px-3 py-2 uppercase tracking-[0.06em] hover:border-white disabled:opacity-40">Record all {REELS.length} (one file each)</button>
          </div>
          {busy && <button onClick={() => { stopRef.current = true; }} className="w-full border border-white/40 px-3 py-2 uppercase">Stop</button>}
          <p className="text-white/60">Capture ≈ {capW}×{capH} → saved as {W}×{H}. {capH < H * 0.9 ? "For sharper video use full screen (F11), a high-resolution screen, or 16:9." : "Full resolution."}</p>
          <p className="text-white/60">When recording, choose “This tab”, then keep this tab in front until the files download.</p>
          {msg && <p className="border-l-2 border-[#f06fae] pl-3 text-[#f9b4d3]">{msg}</p>}
          <button onClick={done} disabled={busy} className="label-caps text-white/70 underline underline-offset-4 hover:text-white">Done: back to the reel studio</button>
        </div>
      </div>
      {!panel && busy && <button onClick={() => setPanel(true)} className="fixed left-0 top-0 z-50 h-16 w-16 opacity-0" aria-label="Show controls" />}
    </div>
  );
}
