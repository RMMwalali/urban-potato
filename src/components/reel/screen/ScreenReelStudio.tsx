"use client";
// Screen reels: the real app runs in an iframe inside a 3D device; a scripted cursor drives it while the
// camera follows, then the stage is recorded with tab capture (cropped to the stage) plus the built-in score.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildReel, type ReelConfig } from "../scenes";
import { scheduleScore, type Hit } from "../score";
import { fill, REELS, type ReelDef, type ReelVars, type Step, type Target } from "./reels";
import { startFilming, stopFilming } from "@/app/actions/showcase";

const FORMATS = { portrait: { W: 1080, H: 1920, label: "9:16 vertical (TikTok, Reels, Shorts)" }, landscape: { W: 1920, H: 1080, label: "16:9 (YouTube, website)" } } as const;
type Format = keyof typeof FORMATS;

// Device geometry in device pixels: viewport of the iframe, bezel/chrome, base scale on the stage.
const DEVICES = {
  desktop: { vw: 1280, vh: 1480, top: 44, side: 0, radius: 18, s0: { portrait: 0.8, landscape: 0.84 }, vhLand: 920 },
  phone: { vw: 400, vh: 860, top: 22, side: 14, radius: 54, s0: { portrait: 1.66, landscape: 0.98 }, vhLand: 860 },
} as const;

const INTRO = 3.6, TITLE = 2.6, ENTER = 1.6, EXIT = 0.9, OUTRO = 4.4;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Cam = { s: number; fx: number; fy: number; rx: number; ry: number; rz: number; o: number };
type Tween<T> = { from: T; to: T; t0: number; ms: number };

function nominal(st: Step): number {
  switch (st.do) {
    case "go": return st.ms ?? 1800;
    case "move": return st.ms ?? 900;
    case "click": return (st.ms ?? 1000) + (st.nav ? 1500 : 250);
    case "type": return (st.ms ?? 0) + 500 + (st.text.length * 1000) / (st.cps ?? 14);
    case "select": return st.ms ?? 1100;
    case "submit": return st.ms ?? 1400;
    case "scroll": return st.ms ?? 1000;
    case "cam": return st.ms ?? 1200;
    case "caption": return st.ms ?? 200;
    case "pop": return st.ms ?? 2000;
    case "wait": return st.ms;
    case "waitFor": return st.ms ?? 300;
  }
}

export function reelLength(r: ReelDef) {
  return INTRO + TITLE + ENTER + r.steps.reduce((t, s) => t + nominal(s) / 1000, 0) + EXIT + OUTRO;
}

function pickMime() {
  const avc = ["avc1.640028", "avc1.4D0028", "avc1.42E028", "avc1.42E01E"];
  const types = [...avc.flatMap((v) => [`video/mp4;codecs=${v},mp4a.40.2`, `video/mp4;codecs=${v},opus`]), "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

export function ScreenReelStudio({ cfg, initialReel, initialFormat, host }: { cfg: ReelConfig; initialReel: string; initialFormat: Format; host: string }) {
  const [format, setFormat] = useState<Format>(initialFormat);
  const [reelId, setReelId] = useState(initialReel);
  const [status, setStatus] = useState<"idle" | "playing" | "recording">("idle");
  const [msg, setMsg] = useState("");
  const [fit, setFit] = useState({ k: 0.5, dpr: 1 });
  const [panel, setPanel] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLSpanElement>(null);
  const popLayer = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);

  const reel = REELS.find((r) => r.id === reelId) ?? REELS[0];
  const { W, H } = FORMATS[format];
  const dev = DEVICES[reel.device];
  const vh = format === "landscape" ? dev.vhLand : dev.vh;
  const DW = dev.vw + dev.side * 2, DH = vh + dev.top + dev.side;
  const s0 = dev.s0[format];
  const center = format === "portrait" ? { x: W / 2, y: H * 0.45 } : { x: W * 0.63, y: H / 2 };
  const promo = useMemo(() => buildReel(cfg), [cfg]);
  const ctaStart = promo.scenes.find((s) => s.id === "cta")?.start ?? promo.length - OUTRO;

  // live camera + cursor state, animated in one rAF loop
  const cam = useRef<Cam>({ s: s0 * 0.55, fx: DW / 2, fy: DH / 2, rx: 32, ry: -38, rz: 6, o: 0 });
  const camTw = useRef<Tween<Cam> | null>(null);
  const cur = useRef({ x: DW * 0.7, y: DH * 0.7, press: 0, show: 0 });
  const curTw = useRef<{ from: { x: number; y: number }; to: { x: number; y: number }; t0: number; ms: number; bend: number } | null>(null);
  const follow = useRef(false);
  const t0Ref = useRef(performance.now());

  // fit the stage to the window
  useEffect(() => {
    const onResize = () => setFit({ k: Math.min(window.innerWidth / W, window.innerHeight / H), dpr: window.devicePixelRatio || 1 });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [W, H]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const t = (now - t0Ref.current) / 1000;
      const tw = camTw.current;
      if (tw) {
        const p = Math.min(1, (now - tw.t0) / tw.ms), e = ease(p);
        const c = cam.current;
        (Object.keys(c) as (keyof Cam)[]).forEach((k) => (c[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e));
        if (p >= 1) camTw.current = null;
      }
      const ct = curTw.current;
      if (ct) {
        const p = Math.min(1, (now - ct.t0) / ct.ms), e = ease(p);
        const mx = (ct.from.x + ct.to.x) / 2, my = (ct.from.y + ct.to.y) / 2;
        const dx = ct.to.x - ct.from.x, dy = ct.to.y - ct.from.y;
        const cx = mx - dy * ct.bend, cy = my + dx * ct.bend; // quadratic curve: a hand never moves in a straight line
        cur.current.x = (1 - e) * (1 - e) * ct.from.x + 2 * (1 - e) * e * cx + e * e * ct.to.x;
        cur.current.y = (1 - e) * (1 - e) * ct.from.y + 2 * (1 - e) * e * cy + e * e * ct.to.y;
        if (p >= 1) curTw.current = null;
      }
      if (follow.current && !camTw.current) {
        // camera drifts after the cursor when zoomed in
        const c = cam.current;
        c.fx += (cur.current.x - c.fx) * 0.035;
        c.fy += (cur.current.y - c.fy) * 0.035;
      }
      const c = cam.current;
      const fx = Math.max(0, Math.min(DW, c.fx)), fy = Math.max(0, Math.min(DH, c.fy));
      const breathe = { x: Math.sin(t * 0.55) * 1.4, y: Math.cos(t * 0.42) * 1.8 };
      if (camRef.current) camRef.current.style.transform = `rotateX(${c.rx + breathe.x}deg) rotateY(${c.ry + breathe.y}deg) rotateZ(${c.rz}deg)`;
      if (rigRef.current) {
        rigRef.current.style.transform = `translate3d(${center.x - c.s * fx}px, ${center.y - c.s * fy}px, 0) scale(${c.s})`;
        rigRef.current.style.opacity = String(c.o);
      }
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cur.current.x}px, ${cur.current.y}px, 30px) scale(${(1 - cur.current.press * 0.18) / Math.max(0.6, c.s / s0)})`;
        cursorRef.current.style.opacity = String(cur.current.show);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [DW, DH, center.x, center.y, s0]);

  // still: SAY NO MORE at its biggest
  useEffect(() => {
    const c = canvasRef.current?.getContext("2d");
    if (!c || status !== "idle") return;
    document.fonts.load('700 100px "Geist Variable"').finally(() => promo.render(c, 2.7, W, H));
  }, [promo, W, H, status]);

  const setCam = useCallback((to: Partial<Cam>, ms: number) => {
    camTw.current = { from: { ...cam.current }, to: { ...cam.current, ...to }, t0: performance.now(), ms: Math.max(1, ms) };
  }, []);

  /* ---------- the page inside the device ---------- */
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
      list = pool.filter((el) => !pool.some((o) => o !== el && el.contains(o))); // innermost match
    } else if (t.sel) {
      list = [...root.querySelectorAll(t.sel)].filter(visible);
    }
    return list[t.nth ?? 0] ?? null;
  }, []);

  const waitFind = useCallback(async (t: Target, ms = 7000) => {
    const end = performance.now() + ms;
    for (;;) {
      const el = find(t);
      if (el) return el;
      if (performance.now() > end || stopRef.current) throw new Error(`Couldn't find ${JSON.stringify(t)} on ${frameRef.current?.contentWindow?.location.pathname}`);
      await sleep(120);
    }
  }, [find]);

  const box = useCallback((el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + dev.side, y: r.top + dev.top, w: r.width, h: r.height, cx: r.left + dev.side + r.width / 2, cy: r.top + dev.top + r.height / 2 };
  }, [dev.side, dev.top]);

  const reveal = useCallback(async (el: Element) => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    const r = el.getBoundingClientRect();
    if (r.top > 70 && r.bottom < vh - 70) return;
    win.scrollTo({ top: win.scrollY + r.top - vh * 0.32, behavior: "smooth" });
    await sleep(800);
  }, [vh]);

  const moveTo = useCallback(async (el: Element, ms = 850) => {
    await reveal(el);
    const b = box(el);
    const to = { x: Math.min(b.cx, b.x + Math.min(b.w * 0.5, 160)), y: b.cy };
    cur.current.show = 1;
    curTw.current = { from: { x: cur.current.x, y: cur.current.y }, to, t0: performance.now(), ms, bend: (Math.random() - 0.5) * 0.35 };
    await sleep(ms);
  }, [box, reveal]);

  const press = useCallback(async () => {
    cur.current.press = 1;
    const layer = popLayer.current;
    if (layer) {
      const ring = document.createElement("div");
      ring.className = "reel-ripple";
      ring.style.left = `${cur.current.x}px`; ring.style.top = `${cur.current.y}px`;
      layer.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    }
    await sleep(160);
    cur.current.press = 0;
  }, []);

  const setValue = (el: Element, v: string) => {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(el, v);
    el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  };

  // The app asks "Are you sure?" before some actions; on camera, the answer is always yes.
  const autoConfirm = () => {
    try {
      const w = frameRef.current?.contentWindow as (Window & { __reel?: boolean }) | null;
      if (w && !w.__reel) { w.confirm = () => true; w.alert = () => {}; w.__reel = true; }
    } catch {}
  };

  const waitNav = useCallback(async (before: string) => {
    const end = performance.now() + 9000;
    while (performance.now() < end && !stopRef.current) {
      const href = frameRef.current?.contentWindow?.location.href;
      if (href && href !== before && frameRef.current?.contentDocument?.readyState === "complete") break;
      await sleep(100);
    }
    await sleep(350);
  }, []);

  const caption = (text: string, sub?: string) => {
    const el = captionRef.current;
    if (!el) return;
    el.innerHTML = "";
    if (!text) return;
    const wrap = document.createElement("div");
    wrap.className = "reel-caption";
    const h = document.createElement("p"); h.className = "reel-cap-main"; const hs = document.createElement("span"); hs.textContent = text; h.appendChild(hs);
    wrap.appendChild(h);
    if (sub) { const p = document.createElement("p"); p.className = "reel-cap-sub"; const ps = document.createElement("span"); ps.textContent = sub; p.appendChild(ps); wrap.appendChild(p); }
    el.appendChild(wrap);
  };

  const pop = async (el: Element, label: string | undefined, ms: number) => {
    const layer = popLayer.current;
    if (!layer) return;
    await reveal(el);
    const b = box(el);
    const card = document.createElement("div");
    card.className = "reel-pop";
    card.style.left = `${b.x - 14}px`; card.style.top = `${b.y - 10}px`; card.style.minWidth = `${Math.min(b.w + 28, 900)}px`;
    const text = ((el as HTMLElement).innerText ?? "").trim().split("\n").filter(Boolean).slice(0, 3).join(" · ").slice(0, 140);
    card.innerHTML = "";
    if (label) { const l = document.createElement("span"); l.className = "reel-pop-label"; l.textContent = label; card.appendChild(l); }
    const t = document.createElement("span"); t.className = "reel-pop-text"; t.textContent = text; card.appendChild(t);
    layer.appendChild(card);
    requestAnimationFrame(() => card.classList.add("in"));
    await sleep(ms - 450);
    card.classList.remove("in"); card.classList.add("out");
    setTimeout(() => card.remove(), 600);
  };

  const navigate = useCallback(async (path: string) => {
    const f = frameRef.current;
    if (!f) return;
    await new Promise<void>((res) => {
      const done = () => { f.removeEventListener("load", done); res(); };
      f.addEventListener("load", done);
      f.src = path;
      setTimeout(done, 9000);
    });
    try { (f.contentDocument?.documentElement as HTMLElement).style.scrollBehavior = "smooth"; } catch {}
    autoConfirm();
    await sleep(250);
  }, []);

  // show the current address in the browser chrome
  const syncUrl = () => {
    try { if (urlRef.current) urlRef.current.textContent = `${host}${frameRef.current?.contentWindow?.location.pathname ?? ""}`; } catch {}
  };

  async function runStep(st: Step, vars: ReelVars) {
    switch (st.do) {
      case "go": {
        setCam({ s: cam.current.s * 0.92, ry: cam.current.ry + 10 }, 500);
        await navigate(fill(st.path, vars));
        syncUrl();
        setCam({ s: cam.current.s / 0.92, ry: cam.current.ry - 10 }, 700);
        return;
      }
      case "move": return moveTo(await waitFind(st.to), st.ms);
      case "click": {
        const el = await waitFind(st.to);
        await moveTo(el, st.ms ?? 850);
        const before = frameRef.current?.contentWindow?.location.href ?? "";
        await press();
        autoConfirm();
        (el as HTMLElement).click();
        if (st.nav) { await waitNav(before); syncUrl(); autoConfirm(); }
        return;
      }
      case "type": {
        const el = await waitFind(st.to);
        await moveTo(el, 700);
        await press();
        (el as HTMLElement).focus();
        const text = fill(st.text, vars);
        for (let i = 1; i <= text.length && !stopRef.current; i++) {
          setValue(el, text.slice(0, i));
          await sleep(1000 / (st.cps ?? 14));
        }
        return;
      }
      case "select": {
        const el = (await waitFind(st.to)) as HTMLSelectElement;
        await moveTo(el, 700);
        await press();
        const opt = [...el.options].find((o) => norm(o.text).startsWith(norm(st.option)));
        if (opt) setValue(el, opt.value);
        return;
      }
      case "submit": {
        const el = await waitFind(st.to);
        const before = frameRef.current?.contentWindow?.location.href ?? "";
        (el as HTMLInputElement).form?.requestSubmit();
        await waitNav(before);
        syncUrl();
        return;
      }
      case "scroll": return reveal(await waitFind(st.to));
      case "cam": {
        const ms = st.ms ?? 1200;
        let fx = DW / 2, fy = DH / 2;
        follow.current = false;
        if (st.focus === "cursor") { fx = cur.current.x; fy = cur.current.y; follow.current = true; }
        else if (st.focus && st.focus !== "center") { const el = await waitFind(st.focus); await reveal(el); const b = box(el); fx = b.cx; fy = b.cy; follow.current = true; }
        setCam({ s: s0 * (st.zoom ?? 1), fx, fy, rx: st.rx ?? 0, ry: st.ry ?? 0, rz: st.rz ?? 0, o: 1 }, ms);
        return;
      }
      case "caption": caption(st.text, st.sub); return;
      case "pop": { const el = await waitFind(st.to); await moveTo(el, 600); return pop(el, st.label, st.ms ?? 2000); }
      case "wait": return;
      case "waitFor": { await waitFind(st.to, 9000); return; }
    }
  }

  /** Plays one reel on the stage; returns hit times for the score. */
  async function play(r: ReelDef, vars: ReelVars, onStart: (len: number, hits: Hit[], finalAt: number) => void) {
    const ctx = canvasRef.current!.getContext("2d")!;
    const steps = r.steps;
    const plan: number[] = [];
    let acc = INTRO + TITLE + ENTER;
    for (const st of steps) { acc += nominal(st) / 1000; plan.push(acc); }
    const outroAt = acc + EXIT;
    const length = outroAt + OUTRO;
    const hits: Hit[] = [{ t: 0.15 }, { t: 1.2 }, { t: 2.25, big: true }, { t: INTRO, big: true }, { t: INTRO + TITLE }];
    steps.forEach((st, i) => st.do === "caption" && hits.push({ t: i ? plan[i - 1] : INTRO + TITLE + ENTER }));

    // reset the stage and preload the first page during the intro
    caption("");
    if (captionRef.current) captionRef.current.innerHTML = "";
    if (popLayer.current) popLayer.current.querySelectorAll(".reel-pop").forEach((n) => n.remove());
    follow.current = false;
    cam.current = { s: s0 * 0.5, fx: DW / 2, fy: DH / 2, rx: 34, ry: -40, rz: 7, o: 0 };
    cur.current = { x: DW * 0.72, y: DH * 0.78, press: 0, show: 0 };
    hudRef.current?.classList.remove("in");
    titleRef.current?.classList.remove("in", "out");
    const preload = navigate(fill(r.start, vars)).then(syncUrl);

    const start = performance.now();
    const at = (s: number) => sleep(Math.max(0, start + s * 1000 - performance.now()));
    onStart(length, hits, outroAt);

    // 1. SAY NO MORE (canvas)
    canvasRef.current!.style.opacity = "1";
    await new Promise<void>((res) => {
      const f = () => {
        const t = (performance.now() - start) / 1000;
        promo.render(ctx, Math.min(t, INTRO - 0.01), W, H);
        if (t < INTRO && !stopRef.current) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    });
    // 2. feature title card
    canvasRef.current!.style.opacity = "0";
    titleRef.current?.classList.add("in");
    await preload;
    await at(INTRO + TITLE - 0.5);
    titleRef.current?.classList.add("out");
    // 3. the device flies in
    hudRef.current?.classList.add("in");
    setCam({ s: s0, fx: DW / 2, fy: DH / 2, rx: 10, ry: -16, rz: 0, o: 1 }, ENTER * 1000);
    await at(INTRO + TITLE + ENTER);
    // 4. the script, kept on its planned timeline
    for (let i = 0; i < steps.length && !stopRef.current; i++) {
      await runStep(steps[i], vars);
      await at(plan[i]);
    }
    // 5. fly out, then the closing card
    cur.current.show = 0;
    follow.current = false;
    caption("");
    hudRef.current?.classList.remove("in");
    setCam({ s: s0 * 0.45, ry: 48, rx: -18, rz: -6, o: 0 }, EXIT * 1000);
    await at(outroAt);
    canvasRef.current!.style.opacity = "1";
    await new Promise<void>((res) => {
      const f = () => {
        const lt = (performance.now() - start) / 1000 - outroAt;
        promo.render(ctx, ctaStart + 0.25 + Math.min(lt, OUTRO - 0.3), W, H);
        if (lt < OUTRO && !stopRef.current) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    });
  }

  async function freshVars(): Promise<ReelVars | null> {
    const v = await startFilming();
    if ("error" in v) { setMsg(v.error); return null; }
    return v;
  }

  async function withAudio(fn: (begin: (len: number, hits: Hit[], finalAt: number) => void, dest: MediaStreamAudioDestinationNode) => Promise<void>) {
    const actx = new AudioContext({ sampleRate: 48000 });
    await actx.resume();
    const dest = actx.createMediaStreamDestination();
    const out = actx.createGain();
    out.connect(actx.destination); out.connect(dest);
    try {
      await fn((len, hits, finalAt) => scheduleScore(actx, out, actx.currentTime + 0.02, hits, len, finalAt), dest);
    } finally {
      await actx.close();
    }
  }

  async function preview() {
    setMsg(""); stopRef.current = false; setStatus("playing"); setPanel(false);
    try {
      const vars = await freshVars();
      if (vars) await withAudio((begin) => play(reel, vars, begin));
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
    // normalise to exact W×H: crop to the stage ourselves if the browser couldn't
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
        const vars = await freshVars();
        if (!vars) break;
        await withAudio(async (begin, dest) => {
          const chunks: Blob[] = [];
          const rec = new MediaRecorder(new MediaStream([...out.captureStream(60).getVideoTracks(), ...dest.stream.getAudioTracks()]), { mimeType: mime, videoBitsPerSecond: 18_000_000, audioBitsPerSecond: 192_000 });
          rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
          rec.start(250);
          await play(r, vars, begin);
          await sleep(300);
          const stopped = new Promise<void>((res) => (rec.onstop = () => res()));
          rec.stop(); await stopped;
          if (!stopRef.current) {
            const type = mime.split(";")[0];
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob(chunks, { type }));
            a.download = `${cfg.name.toLowerCase()}-${r.id}-${format}.${type.includes("mp4") ? "mp4" : "webm"}`;
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
  const idx = REELS.indexOf(reel) + 1;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div ref={stageRef} className="reel-stage absolute left-1/2 top-1/2 overflow-hidden" style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${fit.k})`, perspective: format === "portrait" ? 2600 : 3000 }}>
        {/* depth: a huge outlined word far behind the device */}
        <p className="reel-backword" style={{ fontSize: format === "portrait" ? 340 : 300 }}>{reel.title}</p>

        <div ref={camRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: `${center.x}px ${center.y}px` }}>
          <div ref={rigRef} className="absolute left-0 top-0" style={{ width: DW, height: DH, transformOrigin: "0 0", transformStyle: "preserve-3d", opacity: 0 }}>
            <div className={`reel-device ${reel.device}`} style={{ width: DW, height: DH, borderRadius: dev.radius }}>
              {reel.device === "desktop" ? (
                <div className="reel-chrome" style={{ height: dev.top }}><i /><i /><i /><span ref={urlRef} className="reel-url">{host}</span></div>
              ) : (
                <div className="reel-notch" style={{ height: dev.top }} />
              )}
              <iframe ref={frameRef} title="Darling" className="absolute bg-paper" style={{ left: dev.side, top: dev.top, width: dev.vw, height: vh, border: 0, borderRadius: reel.device === "phone" ? 40 : 0 }} />
            </div>
            <div ref={popLayer} className="absolute inset-0" style={{ transformStyle: "preserve-3d", pointerEvents: "none" }} />
            <div ref={cursorRef} className="reel-cursor" style={{ opacity: 0 }}>
              <svg width="34" height="46" viewBox="0 0 34 46" aria-hidden><path d="M2 2 L2 36 L11 28 L17 43 L23 40 L17 26 L30 26 Z" fill="#fff" stroke="#1c1f24" strokeWidth="2.6" strokeLinejoin="round" /></svg>
            </div>
          </div>
        </div>

        {/* persistent label while the device is on screen */}
        <div ref={hudRef} className="reel-hud" style={{ left: 64, top: format === "portrait" ? 84 : 64 }}>
          <span className="reel-logo"><b>{cfg.name.toUpperCase().slice(0, 3)}</b><em>{cfg.name.toUpperCase().slice(3)}</em></span>
          <span className="reel-hud-label">{String(idx).padStart(2, "0")} / {String(REELS.length).padStart(2, "0")} · {reel.title}</span>
        </div>

        <div ref={captionRef} className={`reel-captions ${format}`} />

        {/* feature title card */}
        <div ref={titleRef} className="reel-title">
          <p className="reel-title-label">{String(idx).padStart(2, "0")} / {String(REELS.length).padStart(2, "0")}</p>
          <h2 style={{ fontSize: format === "portrait" ? 150 : 170 }}>{reel.title.split(" ").map((w, i) => <span key={i}><span style={{ animationDelay: `${0.08 * i}s` }}>{w}</span></span>)}</h2>
          <p className="reel-title-line">{reel.line}</p>
        </div>

        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 transition-opacity duration-300" style={{ width: W, height: H }} />
      </div>

      {/* controls (outside the recorded stage) */}
      <div className={`fixed left-4 top-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] border border-white/20 bg-black/80 p-5 text-[13px] text-white backdrop-blur transition-opacity duration-500 ${panel ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <p className="label-caps text-white/60">Screen reels · {cfg.name}</p>
        <div className="mt-4 space-y-3">
          <select value={reelId} onChange={(e) => setReelId(e.target.value)} disabled={busy} className="w-full border border-white/30 bg-black px-3 py-2">
            {REELS.map((r, i) => <option key={r.id} value={r.id}>{String(i + 1).padStart(2, "0")} · {r.title} (~{Math.round(reelLength(r))}s)</option>)}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value as Format)} disabled={busy} className="w-full border border-white/30 bg-black px-3 py-2">
            {Object.entries(FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={preview} disabled={busy} className="border border-white px-3 py-2 uppercase tracking-[0.06em] hover:bg-white hover:text-black disabled:opacity-40">Preview</button>
            <button onClick={() => record([reel])} disabled={busy} className="bg-white px-3 py-2 uppercase tracking-[0.06em] text-black hover:opacity-80 disabled:opacity-40">Record</button>
            <button onClick={() => record(REELS)} disabled={busy} className="col-span-2 border border-white/40 px-3 py-2 uppercase tracking-[0.06em] hover:border-white disabled:opacity-40">Record all {REELS.length} (one file each)</button>
          </div>
          {busy && <button onClick={() => { stopRef.current = true; }} className="w-full border border-white/40 px-3 py-2 uppercase">Stop</button>}
          <p className="text-white/60">Capture ≈ {capW}×{capH} → saved as {W}×{H}. {capH < H * 0.9 ? "For sharper video use full screen (F11), a high-resolution screen, or 16:9." : "Full resolution."}</p>
          <p className="text-white/60">When recording, choose “This tab”. Keep this tab in front until the files download.</p>
          {msg && <p className="border-l-2 border-[#f06fae] pl-3 text-[#f9b4d3]">{msg}</p>}
          <button onClick={done} disabled={busy} className="label-caps text-white/70 underline underline-offset-4 hover:text-white">Done: back to the reel studio</button>
        </div>
      </div>
      {/* invisible until hovered, so it never shows up in a recording */}
      {!panel && busy && <button onClick={() => setPanel(true)} className="fixed left-0 top-0 z-50 h-16 w-16 opacity-0" aria-label="Show controls" />}
    </div>
  );
}
