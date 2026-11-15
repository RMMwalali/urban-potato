"use client";
// How-to demos: the real app runs in an iframe inside a browser frame on a 3D stage. An animated cursor
// works through the pages (sidebar, links, forms, the address bar) while the camera follows it the same
// way in every demo. No added text: only the app's own screens. Recorded with tab capture, cropped to
// the stage, one MP4 per demo.
import { useCallback, useEffect, useRef, useState } from "react";
import { scheduleScore } from "../score";
import { fill, fillTarget, REELS, type Entry, type ReelDef, type ReelVars, type Step, type Target } from "./reels";
import { makeSfx, silentSfx, type Sfx } from "./sfx";
import { startFilming, stopFilming } from "@/app/actions/showcase";

const FORMATS = {
  portrait: { W: 1080, H: 1920, label: "9:16 vertical (TikTok, Reels, Shorts)", vw: 1100, vh: 1880, s0: 0.85, zoom: 1.6 },
  landscape: { W: 1920, H: 1080, label: "16:9 (YouTube, website)", vw: 1440, vh: 880, s0: 0.98, zoom: 1.45 },
} as const;
type Format = keyof typeof FORMATS;
const BAR = 46; // browser chrome height, device px
const FADE = 0.5, ENTER = 1.1, HOLD_END = 0.5, EXIT = 0.8;

// Each demo lands differently (the hook in the first second); offsets are applied to the camera rig.
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function nominal(st: Step): number {
  switch (st.do) {
    case "url": return 900 + 700 + (st.path.length + 20) * 55 + 1400;
    case "nav": return 1000 + 1400;
    case "move": return st.ms ?? 1000;
    case "click": return (st.ms ?? 950) + (st.nav ? 1500 : 450);
    case "type": return 850 + (st.text.length * 1000) / (st.cps ?? 13) + 250;
    case "set": return 1250;
    case "select": return 1350;
    case "submit": return 1500;
    case "scroll": return 1100;
    case "wait": return st.ms;
    case "waitFor": return 200;
    case "focus": return (st.ms ?? 1500) + 900;
    case "day": return 1700;
    case "file": return 2200;
  }
}
export const reelLength = (r: ReelDef) => ENTER + r.steps.reduce((t, s) => t + nominal(s) / 1000, 0) + HOLD_END + EXIT;

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
  const [status, setStatus] = useState<"idle" | "playing" | "recording">("idle");
  const [msg, setMsg] = useState("");
  const [fit, setFit] = useState({ k: 0.5, dpr: 1 });
  const [panel, setPanel] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const fxLayer = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLSpanElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);

  const reel = REELS.find((r) => r.id === reelId) ?? REELS[0];
  const tiltRef = useRef(reel.look.tilt);
  tiltRef.current = reel.look.tilt;
  const F = FORMATS[format];
  const { W, H, vw, vh, s0 } = F;
  const DW = vw, DH = vh + BAR;

  // Camera: eases toward a goal every frame (same feel in every demo). Cursor: curved, eased moves.
  const goal = useRef<{ s: number; fx: number; fy: number }>({ s: s0, fx: DW / 2, fy: DH / 2 });
  const cam = useRef<{ s: number; fx: number; fy: number }>({ s: s0, fx: DW / 2, fy: DH / 2 });
  const cur = useRef({ x: DW * 0.62, y: DH * 0.55, press: 0, show: 0 });
  const curTw = useRef<{ from: { x: number; y: number }; to: { x: number; y: number }; t0: number; ms: number; bend: number } | null>(null);
  const follow = useRef(true);
  const pose = useRef<Pose>({ ...REST });
  const poseTw = useRef<{ from: Pose; to: Pose; t0: number; ms: number; ease: (x: number) => number } | null>(null);
  const blur = useRef(0);
  const sfx = useRef<Sfx>(silentSfx);
  const lastTyped = useRef<{ el: Element; text: string } | null>(null);

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
      if (follow.current) { g.fx = cur.current.x; g.fy = cur.current.y; }
      const c = cam.current, k = 1 - Math.exp(-dt * 2.6); // critically damped-ish follow
      c.s += (g.s - c.s) * k; c.fx += (g.fx - c.fx) * k; c.fy += (g.fy - c.fy) * k;
      // keep the frame on the device: never show more than a sliver of the background
      const halfW = W / 2 / c.s, halfH = H / 2 / c.s;
      const fx = DW <= halfW * 2 ? DW / 2 : Math.max(halfW - 30, Math.min(DW - halfW + 30, c.fx));
      const fy = DH <= halfH * 2 ? DH / 2 : Math.max(halfH - 30, Math.min(DH - halfH + 30, c.fy));
      // gentle, consistent 3D: the screen turns slightly toward where the cursor is working
      const t = (now - t0) / 1000;
      const tilt = tiltRef.current;
      const ry = (-((fx / DW) - 0.5) * 10 + Math.sin(t * 0.35) * 1.2) * tilt;
      const rx = (4 + ((fy / DH) - 0.5) * 5 + Math.cos(t * 0.3) * 0.8) * tilt;
      const P = pose.current;
      if (camRef.current) camRef.current.style.transform = `translate3d(${P.x}px, ${P.y}px, ${P.z}px) rotateX(${rx + P.rx}deg) rotateY(${ry + P.ry}deg) rotateZ(${P.rz}deg)`;
      if (rigRef.current) {
        rigRef.current.style.transform = `translate3d(${W / 2 - c.s * fx}px, ${H / 2 - c.s * fy}px, 0) scale(${c.s})`;
        rigRef.current.style.filter = blur.current > 0.05 ? `blur(${blur.current.toFixed(2)}px)` : "none";
      }
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cur.current.x}px, ${cur.current.y}px, 24px) scale(${(1 - cur.current.press * 0.2) * (s0 * 1.25 / c.s)})`;
        cursorRef.current.style.opacity = String(cur.current.show);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [W, H, DW, DH, s0]);

  /* ---------- the page inside the browser frame ---------- */
  const win = () => frameRef.current?.contentWindow ?? null;
  const doc = () => frameRef.current?.contentDocument ?? null;
  const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  const find = useCallback((t: Target): Element | null => {
    const d = doc();
    if (!d) return null;
    const root: ParentNode = (t.within && d.querySelector(t.within)) || d;
    let list: Element[] = [];
    if (t.field) {
      const want = norm(t.field);
      for (const l of root.querySelectorAll("label")) {
        if (!norm(l.textContent ?? "").startsWith(want)) continue;
        const ctl = (l.htmlFor && d.getElementById(l.htmlFor)) || l.parentElement?.querySelector("input:not([type=hidden]),select,textarea");
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
  }, []);

  const waitFind = useCallback(async (t: Target, ms = 8000) => {
    const end = performance.now() + ms;
    for (;;) {
      const el = find(t);
      if (el) return el;
      if (performance.now() > end || stopRef.current) throw new Error(`Couldn't find ${JSON.stringify(t)} on ${win()?.location.pathname}`);
      await sleep(120);
    }
  }, [find]);

  const box = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top + BAR, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + BAR + r.height / 2 };
  };

  const glide = async (to: { x: number; y: number }, ms: number) => {
    cur.current.show = 1;
    const dist = Math.hypot(to.x - cur.current.x, to.y - cur.current.y);
    const dur = Math.max(380, Math.min(ms, 260 + dist * 0.9));
    curTw.current = { from: { x: cur.current.x, y: cur.current.y }, to, t0: performance.now(), ms: dur, bend: (Math.random() - 0.5) * 0.3 };
    await sleep(dur + 60);
  };

  // scroll like a person: the page moves while the cursor rests, then the cursor goes to the target
  const reveal = async (el: Element) => {
    const w = win();
    if (!w) return;
    const r = el.getBoundingClientRect();
    if (r.top > 90 && r.bottom < vh - 90) return;
    w.scrollTo({ top: w.scrollY + r.top - vh * 0.35, behavior: "smooth" });
    await sleep(850);
  };

  const moveTo = async (el: Element, ms = 950) => {
    await reveal(el);
    const b = box(el);
    goal.current.s = s0 * F.zoom;
    follow.current = true;
    await glide({ x: Math.min(b.cx, b.x + Math.min(b.w * 0.5, 150)), y: b.cy }, ms);
  };

  const press = async () => {
    cur.current.press = 1;
    sfx.current.click();
    const layer = fxLayer.current;
    if (layer) {
      const ring = document.createElement("div");
      ring.className = "reel-ripple";
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

  // The app asks "Are you sure?" before some actions; in a demo the answer is yes.
  const autoConfirm = () => {
    try {
      const w = win() as (Window & { __reel?: boolean }) | null;
      if (w && !w.__reel) { w.confirm = () => true; w.alert = () => {}; w.__reel = true; }
    } catch {}
  };
  const syncUrl = () => { try { if (urlRef.current) urlRef.current.textContent = `${host}${win()?.location.pathname ?? ""}${win()?.location.search ?? ""}`; } catch {} };

  const settle = async (before: string) => {
    const end = performance.now() + 9000;
    while (performance.now() < end && !stopRef.current) {
      const href = win()?.location.href;
      if (href && href !== before && doc()?.readyState === "complete") break;
      await sleep(100);
    }
    await sleep(300);
    syncUrl(); autoConfirm();
  };

  // page change: the camera pulls back a little so the new page reads as a whole, then follows again
  const pullBack = () => {
    follow.current = false;
    goal.current = { s: s0 * (1 + (F.zoom - 1) * 0.3), fx: DW / 2, fy: DH * 0.42 };
    // scale-punch with a touch of motion blur, and a whoosh, on every page change
    cam.current.s *= 1.06;
    blur.current = 2.2;
    sfx.current.whoosh(0.5);
  };

  // Focus beat: blur and dim the page around the key element, lift it, punch the camera in.
  const focusOn = async (el: Element, ms: number) => {
    await reveal(el);
    const d = doc();
    // lift a whole block (a card, a row, a notice), not a single line of text
    const vwPx = d?.defaultView?.innerWidth ?? vw;
    let target = el as HTMLElement;
    for (let n: HTMLElement | null = target; n && n !== d?.body; n = n.parentElement) {
      const r = n.getBoundingClientRect();
      if (r.width > vwPx * 0.8 || r.height > vh * 0.6) break;
      target = n;
      if (r.height >= 56 && /^(DIV|SECTION|TR|LI|FORM|ARTICLE)$/.test(n.tagName)) break;
    }
    const b = box(target);
    follow.current = false;
    goal.current = { s: s0 * F.zoom * 1.12, fx: b.cx, fy: b.cy };
    await glide({ x: Math.min(b.cx + 40, b.x + b.w - 10), y: b.cy + Math.min(30, b.h / 2) }, 600);
    if (!d) return;
    const veil = d.createElement("div");
    veil.style.cssText = "position:fixed;inset:0;z-index:2147483000;backdrop-filter:blur(5px) brightness(0.82);-webkit-backdrop-filter:blur(5px) brightness(0.82);opacity:0;transition:opacity .45s ease;pointer-events:none";
    d.body.appendChild(veil);
    const prev = { pos: target.style.position, z: target.style.zIndex, tr: target.style.transform, sh: target.style.boxShadow, tn: target.style.transition, bg: target.style.backgroundColor };
    const bgc = d.defaultView?.getComputedStyle(target).backgroundColor;
    target.style.transition = "transform .6s cubic-bezier(0.19,1,0.22,1), box-shadow .6s ease";
    if (d.defaultView?.getComputedStyle(target).position === "static") target.style.position = "relative";
    target.style.zIndex = "2147483001";
    if (!bgc || bgc === "rgba(0, 0, 0, 0)" || bgc === "transparent") target.style.backgroundColor = "#ffffff";
    requestAnimationFrame(() => { veil.style.opacity = "1"; target.style.transform = "scale(1.06)"; target.style.boxShadow = "0 24px 60px rgba(0,0,0,0.28)"; });
    sfx.current.pop();
    await sleep(ms);
    veil.style.opacity = "0";
    target.style.transform = prev.tr; target.style.boxShadow = prev.sh;
    await sleep(450);
    veil.remove();
    Object.assign(target.style, { position: prev.pos, zIndex: prev.z, transition: prev.tn, backgroundColor: prev.bg });
    follow.current = true;
  };

  const load = useCallback(async (path: string) => {
    const f = frameRef.current;
    if (!f) return;
    await new Promise<void>((res) => {
      const done = () => { f.removeEventListener("load", done); res(); };
      f.addEventListener("load", done);
      f.src = path;
      setTimeout(done, 9000);
    });
    syncUrl(); autoConfirm();
    await sleep(200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runStep(st: Step, v: ReelVars) {
    switch (st.do) {
      case "url": {
        const bar = urlRef.current!;
        await glide({ x: 140 + Math.min(bar.offsetWidth, 520) * 0.5, y: BAR / 2 }, 900);
        goal.current = { s: s0 * (1 + (F.zoom - 1) * 0.5), fx: DW * 0.3, fy: BAR + 120 }; follow.current = false;
        await press();
        bar.classList.add("selected"); await sleep(450); bar.classList.remove("selected");
        const full = `${host}${fill(st.path, v)}`;
        for (let i = 1; i <= full.length && !stopRef.current; i++) { bar.textContent = full.slice(0, i); if (i > host.length) sfx.current.key(); await sleep(i <= host.length ? 18 : 55); }
        await sleep(250);
        pullBack();
        await load(fill(st.path, v));
        return;
      }
      case "nav": {
        const el = await waitFind({ text: st.label, sel: '[data-tour="nav"] a' });
        await moveTo(el, 900);
        const before = win()?.location.href ?? "";
        await press(); autoConfirm(); (el as HTMLElement).click();
        pullBack();
        await settle(before);
        return;
      }
      case "move": { await moveTo(await waitFind(fillTarget(st.to, v)), st.ms); return; }
      case "click": {
        const el = await waitFind(fillTarget(st.to, v));
        await moveTo(el, st.ms ?? 950);
        const before = win()?.location.href ?? "";
        await press(); autoConfirm(); (el as HTMLElement).click();
        if (st.nav) { pullBack(); await settle(before); }
        return;
      }
      case "type": {
        const el = await waitFind(fillTarget(st.to, v));
        await moveTo(el, 800);
        await press();
        (el as HTMLElement).focus();
        const text = fill(st.text, v);
        lastTyped.current = { el, text };
        for (let i = 1; i <= text.length && !stopRef.current; i++) { setValue(el, text.slice(0, i)); if (text[i - 1] !== " ") sfx.current.key(); await sleep(1000 / (st.cps ?? 13) * (0.7 + Math.random() * 0.6)); }
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
        await press();
        (el as HTMLInputElement).form?.requestSubmit();
        pullBack();
        await settle(before);
        return;
      }
      case "scroll": {
        const el = await waitFind(fillTarget(st.to, v));
        follow.current = false;
        goal.current.fy = DH * 0.5;
        await reveal(el);
        follow.current = true;
        return;
      }
      case "wait": return;
      case "waitFor": {
        try { await waitFind(fillTarget(st.to, v), st.ms ?? 9000); }
        catch (err) {
          // nothing happened after typing? retype the last field once, like a person would
          let lt = lastTyped.current;
          if (!lt || !lt.el.isConnected) {
            const code = find({ sel: 'input[aria-label="M-Pesa code"]' }) as HTMLInputElement | null;
            lt = code?.value ? { el: code, text: code.value } : null;
          }
          if (!lt) throw err;
          setValue(lt.el, "");
          await sleep(150);
          setValue(lt.el, lt.text);
          await waitFind(fillTarget(st.to, v), 8000);
        }
        return;
      }
      case "file": {
        // what a person does: click "Add photos", pick files. The files are generated artwork.
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
          const bytes = new Uint8Array(await blob.arrayBuffer());
          dt.items.add(new w.File([bytes], `photo-${k + 1}.png`, { type: "image/png" }));
        }
        input.files = dt.files;
        input.dispatchEvent(new w.Event("change", { bubbles: true }));
        return;
      }
      case "day": {
        for (let i = st.from; i < st.from + 10 && !stopRef.current; i++) {
          const day = find({ sel: ".overflow-x-auto button", nth: i });
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
      case "focus": { await focusOn(await waitFind(fillTarget(st.to, v)), st.ms ?? 1500); return; }
    }
  }

  async function play(r: ReelDef, v: ReelVars, onStart: (len: number) => void) {
    lastTyped.current = null;
    const curtain = curtainRef.current!;
    curtain.style.transition = "none"; curtain.style.opacity = "1";
    curtain.style.backgroundColor = r.look.bg;
    if (fxLayer.current) fxLayer.current.innerHTML = "";
    // open on the starting page, wide, cursor resting
    await load(fill(r.start, v));
    goal.current = { s: s0, fx: DW / 2, fy: DH / 2 }; cam.current = { ...goal.current };
    follow.current = false;
    cur.current = { x: DW * 0.62, y: DH * 0.55, press: 0, show: 1 };
    await sleep(300);

    const plan: number[] = [];
    let acc = ENTER;
    for (const st of r.steps) { acc += nominal(st) / 1000; plan.push(acc); }
    const length = acc + HOLD_END + EXIT;
    const start = performance.now();
    const at = (s: number) => sleep(Math.max(0, start + s * 1000 - performance.now()));
    onStart(length);

    // the hook: the screen lands with a whoosh and a low hit, already mid-action
    pose.current = { ...ENTRIES[r.look.entry] };
    poseTw.current = { from: { ...pose.current }, to: { ...REST }, t0: performance.now(), ms: ENTER * 1000, ease: outExpo };
    curtain.style.transition = `opacity ${FADE}s ease`; curtain.style.opacity = "0";
    sfx.current.whoosh(0.7);
    setTimeout(() => sfx.current.hit(), ENTER * 450);
    await at(ENTER * 0.7);
    for (let i = 0; i < r.steps.length && !stopRef.current; i++) {
      await runStep(r.steps[i], v);
      await at(plan[i]); // stay on the planned timeline so music and pacing match
    }
    await at(acc + HOLD_END);
    // leave the way it came in, mirrored
    const out = ENTRIES[r.look.entry];
    poseTw.current = { from: { ...pose.current }, to: { x: -out.x * 0.6, y: -out.y * 0.6, z: out.z * 0.8, rx: -out.rx * 0.6, ry: -out.ry * 0.6, rz: -out.rz }, t0: performance.now(), ms: EXIT * 1000, ease: (x) => x * x * x };
    sfx.current.whoosh(0.6);
    follow.current = false;
    cur.current.show = 0;
    curtain.style.transition = `opacity ${EXIT * 0.8}s ease ${EXIT * 0.2}s`; curtain.style.opacity = "1";
    await at(length);
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
    out.connect(actx.destination); out.connect(dest);
    const musicBus = actx.createGain();
    musicBus.gain.value = 0.28; // music sits under the interface sounds
    musicBus.connect(out);
    sfx.current = sound ? makeSfx(actx, out) : silentSfx;
    try {
      await fn((len) => { if (music) scheduleScore(actx, musicBus, actx.currentTime + 0.02, [], len, len - 2.4); }, dest);
    } finally {
      sfx.current = silentSfx;
      await actx.close();
    }
  }

  async function preview() {
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
        video: { displaySurface: "browser", frameRate: 60, width: { ideal: 3840 }, height: { ideal: 3840 } },
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
    const video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.srcObject = screen;
    await video.play();
    await sleep(600);
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const oc = out.getContext("2d")!;
    let drawing = true;
    const draw = () => {
      if (!drawing) return;
      if (video.videoWidth) {
        if (cropped) oc.drawImage(video, 0, 0, W, H);
        else {
          const r = stageRef.current!.getBoundingClientRect();
          const sx = video.videoWidth / window.innerWidth, sy = video.videoHeight / window.innerHeight;
          oc.drawImage(video, r.left * sx, r.top * sy, r.width * sx, r.height * sy, 0, 0, W, H);
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
    try {
      for (const r of list) {
        if (stopRef.current) break;
        setReelId(r.id);
        await sleep(400);
        const v = await freshVars();
        if (!v) break;
        await withAudio(async (begin, dest) => {
          const chunks: Blob[] = [];
          const withSound = music || sound;
          const tracks = [...out.captureStream(60).getVideoTracks(), ...(withSound ? dest.stream.getAudioTracks() : [])];
          const rec = new MediaRecorder(new MediaStream(tracks), { mimeType: withSound ? mime : mime.replace(/,(mp4a\.40\.2|opus)/, ""), videoBitsPerSecond: 18_000_000, audioBitsPerSecond: 192_000 });
          rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
          let started = false;
          await play(r, v, (len) => { if (!started) { rec.start(250); started = true; } begin(len); });
          await sleep(200);
          const stopped = new Promise<void>((res) => (rec.onstop = () => res()));
          rec.stop(); await stopped;
          if (!stopRef.current) {
            const type = mime.split(";")[0];
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob(chunks, { type }));
            a.download = `${name.toLowerCase()}-how-to-${r.id}-${format}.${type.includes("mp4") ? "mp4" : "webm"}`;
            a.click();
          }
        });
      }
    } catch (e) { setMsg((e as Error).message); }
    drawing = false;
    screen.getTracks().forEach((t) => t.stop());
    setStatus("idle"); setPanel(true);
  }

  async function done() {
    stopRef.current = true;
    await stopFilming();
    window.location.href = "/admin/reel";
  }

  const capW = Math.round(W * fit.k * fit.dpr), capH = Math.round(H * fit.k * fit.dpr);
  const busy = status !== "idle";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div ref={stageRef} className={`reel-stage absolute left-1/2 top-1/2 overflow-hidden ${reel.look.light ? "light" : ""}`} style={{ width: W, height: H, background: reel.look.bg, transform: `translate(-50%, -50%) scale(${fit.k})`, perspective: format === "portrait" ? 3200 : 3600 }}>
        {/* fine grain so flat colour doesn't band in compression */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07] mix-blend-overlay" aria-hidden><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#grain)" /></svg>
        <div ref={camRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "50% 50%" }}>
          <div ref={rigRef} className="absolute left-0 top-0" style={{ width: DW, height: DH, transformOrigin: "0 0", transformStyle: "preserve-3d" }}>
            <div className="reel-device" style={{ width: DW, height: DH }}>
              <div className="reel-chrome" style={{ height: BAR }}><i /><i /><i /><span ref={urlRef} className="reel-url">{host}</span></div>
              <iframe ref={frameRef} title={name} className="absolute bg-paper" style={{ left: 0, top: BAR, width: vw, height: vh, border: 0 }} />
            </div>
            <div ref={fxLayer} className="absolute inset-0" style={{ transformStyle: "preserve-3d", pointerEvents: "none" }} />
            <div ref={cursorRef} className="reel-cursor" style={{ opacity: 0 }}>
              <svg width="30" height="40" viewBox="0 0 34 46" aria-hidden><path d="M2 2 L2 36 L11 28 L17 43 L23 40 L17 26 L30 26 Z" fill="#fff" stroke="#1c1f24" strokeWidth="2.6" strokeLinejoin="round" /></svg>
            </div>
          </div>
        </div>
        <div ref={curtainRef} className="absolute inset-0" style={{ opacity: 1, backgroundColor: reel.look.bg }} />
      </div>

      {/* controls (outside the recorded stage) */}
      <div className={`fixed left-4 top-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] border border-white/20 bg-black/80 p-5 text-[13px] text-white backdrop-blur transition-opacity duration-500 ${panel ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <p className="label-caps text-white/60">How-to demos · {name}</p>
        <div className="mt-4 space-y-3">
          <select value={reelId} onChange={(e) => setReelId(e.target.value)} disabled={busy} className="w-full border border-white/30 bg-black px-3 py-2">
            {REELS.map((r, i) => <option key={r.id} value={r.id}>{String(i + 1).padStart(2, "0")} · {r.title} (~{Math.round(reelLength(r))}s)</option>)}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value as Format)} disabled={busy} className="w-full border border-white/30 bg-black px-3 py-2">
            {Object.entries(FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-white/80"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} disabled={busy} /> Interface sounds (clicks, typing, whooshes)</label>
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
      {/* invisible until hovered, so it never shows up in a recording */}
      {!panel && busy && <button onClick={() => setPanel(true)} className="fixed left-0 top-0 z-50 h-16 w-16 opacity-0" aria-label="Show controls" />}
    </div>
  );
}
