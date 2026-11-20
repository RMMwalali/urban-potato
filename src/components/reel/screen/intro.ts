// The opening of every reel, always on white: soft pink and blue light, a 3D floor grid, the wordmark as solid
// extruded letters with a small HQ, and the product's own UI tiles (a booking, an M-Pesa payment, a reminder…)
// flying in from the depth and floating around it. Then everything bursts outward as the logo flies past the
// camera. Pure CSS 3D driven by the Web Animations API, so it's captured like everything else.
import { tile, type IconName } from "./icons";

export const INTRO = 3.3; // seconds the intro lasts
export const INTRO_HANDOFF = 2.7; // when the next part starts (the two overlap)

type Opts = { name: string; light?: boolean; W: number; H: number; spin: 1 | -1; sfx: { whoosh(s?: number): void; hit(): void; pop?(): void } };

const BLUE = "#2b74c4", PINK = "#e24a92", INK = "#1c1f24"; // brighter brand blue and pink for white
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

const TILES: { icon: IconName; title: string; sub: string; accent: string }[] = [
  { icon: "calendar", title: "New booking", sub: "Sat · 2:30 pm · Box braids", accent: PINK },
  { icon: "check", title: "M-Pesa confirmed", sub: "KES 4,500 · Safaricom", accent: "#22a06b" },
  { icon: "bell", title: "Reminder sent", sub: "WhatsApp · tomorrow 10:00", accent: BLUE },
  { icon: "receipt", title: "Receipt printed", sub: "80 mm · #1042", accent: INK },
  { icon: "chart", title: "Today's takings", sub: "KES 18,300", accent: BLUE },
  { icon: "users", title: "Commission", sub: "Worked out for 4 stylists", accent: PINK },
];

/** Builds the intro inside `host` (an empty layer over the stage), plays it, and resolves when it's done. */
export function playIntro(host: HTMLElement, o: Opts): Promise<void> {
  host.innerHTML = "";
  const doc = host.ownerDocument;
  const portrait = o.H > o.W;
  const m = o.name.trim().match(/^(.*?)\s+(HQ)$/i);
  const chars = [...(m ? m[1] : o.name).toUpperCase()];
  const mark = m ? "HQ" : "";
  const size = Math.round(Math.min(o.W * (portrait ? 0.15 : 0.11), o.H * 0.2));
  const STEP = 1.5, depth = Math.max(16, Math.round((size * 0.24) / STEP));

  // white stage with drifting light
  const scene = doc.createElement("div");
  scene.style.cssText = `position:absolute;inset:0;background:#ffffff;overflow:hidden;pointer-events:none;perspective:${Math.round(size * 10)}px;perspective-origin:50% 45%`;
  const glow = (col: string, x: number, y: number, r: number) => {
    const g = doc.createElement("div");
    g.style.cssText = `position:absolute;left:${x * 100}%;top:${y * 100}%;width:${r}px;height:${r}px;margin:${-r / 2}px 0 0 ${-r / 2}px;border-radius:50%;background:radial-gradient(circle, ${col} 0%, ${col}00 70%);filter:blur(10px)`;
    scene.appendChild(g); return g;
  };
  const r0 = Math.max(o.W, o.H) * 0.75;
  const g1 = glow("#ffd1e6", 0.28, 0.32, r0), g2 = glow("#cfe4ff", 0.74, 0.66, r0), g3 = glow("#fff1c9", 0.6, 0.25, r0 * 0.6);

  // a faint floor grid, receding into the distance
  const floor = doc.createElement("div");
  const fw = o.W * 3, fh = o.H * 2.2;
  floor.style.cssText = `position:absolute;left:50%;top:58%;width:${fw}px;height:${fh}px;margin-left:${-fw / 2}px;transform-origin:50% 0;transform:rotateX(80deg);background-image:linear-gradient(rgba(43,116,196,0.16) 1px, transparent 1px),linear-gradient(90deg, rgba(43,116,196,0.16) 1px, transparent 1px);background-size:${size * 0.9}px ${size * 0.9}px;-webkit-mask:linear-gradient(#000, transparent 55%);mask:linear-gradient(#000, transparent 55%);opacity:0`;
  scene.appendChild(floor);

  const orbit = doc.createElement("div");
  orbit.style.cssText = "position:absolute;left:50%;top:46%;width:0;height:0;transform-style:preserve-3d";
  scene.appendChild(orbit);

  // the wordmark, one solid letter per character
  const word = doc.createElement("div");
  word.style.cssText = `position:absolute;left:0;top:0;display:flex;transform-style:preserve-3d;font-weight:600;font-size:${size}px;line-height:1;letter-spacing:-0.02em;white-space:pre`;
  const letters = chars.map((ch, i) => {
    const col = i < 3 ? BLUE : PINK;
    const L = doc.createElement("span");
    L.style.cssText = "position:relative;display:inline-block;transform-style:preserve-3d";
    for (let k = depth; k >= 1; k--) {
      const s = doc.createElement("span"); s.textContent = ch;
      s.style.cssText = `position:absolute;left:0;top:0;color:${shade(col, k <= 2 ? 0.9 : 0.72 - (k / depth) * 0.22)};transform:translateZ(${-k * STEP}px)`;
      L.appendChild(s);
    }
    const face = doc.createElement("span"); face.textContent = ch;
    face.style.cssText = `position:relative;display:inline-block;color:transparent;background:linear-gradient(100deg, ${col} 0%, ${col} 40%, #ffffff 50%, ${col} 60%, ${col} 100%);background-size:320% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 ${size * 0.04}px ${size * 0.08}px ${col}40)`;
    L.appendChild(face);
    word.appendChild(L);
    return { L, face };
  });
  let hq: HTMLElement | null = null;
  if (mark) {
    hq = doc.createElement("span");
    hq.style.cssText = `position:relative;display:inline-block;align-self:flex-start;margin-left:${size * 0.07}px;margin-top:${size * 0.1}px;font-size:${size * 0.34}px;letter-spacing:0;transform-style:preserve-3d;opacity:0`;
    for (let k = Math.round(depth * 0.6); k >= 1; k--) { const s = doc.createElement("span"); s.textContent = mark; s.style.cssText = `position:absolute;left:0;top:0;color:#8b9099;transform:translateZ(${-k * STEP}px)`; hq.appendChild(s); }
    const f = doc.createElement("span"); f.textContent = mark; f.style.cssText = `position:relative;color:${INK}`; hq.appendChild(f);
    word.appendChild(hq);
  }
  orbit.appendChild(word);

  // the product's UI tiles, placed around the logo at different depths
  const tw = size * (portrait ? 2.6 : 2.2);
  const spots = portrait
    ? [[-0.34, -1.95, -160], [0.36, -1.45, 120], [-0.36, 1.4, 80], [0.34, 1.85, -200], [-0.04, -2.8, -380], [0.04, 2.7, -320]]
    : [[-1.55, -0.95, -120], [1.55, -0.8, 110], [-1.7, 0.85, 60], [1.6, 0.95, -180], [-0.15, -1.55, -380], [0.2, 1.6, -300]];
  const unit = portrait ? o.W * 0.5 : o.W * 0.28;
  const tiles = TILES.map((t, i) => {
    const el = tile(doc, { ...t, w: tw });
    const [x, y, z] = spots[i];
    el.style.left = `${x * unit - tw / 2}px`; el.style.top = `${y * size - size * 0.35}px`; el.style.opacity = "0";
    el.dataset.z = String(z);
    orbit.appendChild(el);
    return el;
  });

  host.appendChild(scene);
  // centre the word on the orbit's origin (the stage may be scaled on screen)
  const wb = word.getBoundingClientRect(), hb = host.getBoundingClientRect();
  const k = hb.width / (host.offsetWidth || hb.width) || 1;
  word.style.left = `${-wb.width / k / 2}px`; word.style.top = `${-wb.height / k / 2}px`;

  const ms = (s: number) => s * 1000;
  const anims: Animation[] = [];
  const run = (el: Element, kf: Keyframe[], opt: KeyframeAnimationOptions) => { const a = el.animate(kf, { fill: "forwards", ...opt }); anims.push(a); return a; };

  // light drifts; the floor fades in
  run(g1, [{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${o.W * 0.08}px, ${o.H * 0.05}px) scale(1.15)` }], { duration: ms(INTRO), easing: "ease-in-out" });
  run(g2, [{ transform: "translate(0,0) scale(1.1)" }, { transform: `translate(${-o.W * 0.1}px, ${-o.H * 0.04}px) scale(0.95)` }], { duration: ms(INTRO), easing: "ease-in-out" });
  run(g3, [{ opacity: 0.4 }, { opacity: 1, offset: 0.5 }, { opacity: 0.5 }], { duration: ms(INTRO) });
  run(floor, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: ms(INTRO) });

  // the camera swings round so the solid letters and the tiles' depth show, then flies through
  run(orbit, [
    { transform: `rotateX(22deg) rotateY(${-40 * o.spin}deg) translateZ(-500px)` },
    { transform: `rotateX(12deg) rotateY(${-12 * o.spin}deg) translateZ(-80px)`, offset: 0.42 },
    { transform: `rotateX(8deg) rotateY(${14 * o.spin}deg) translateZ(0px)`, offset: 0.76 },
    { transform: `rotateX(-50deg) rotateY(${26 * o.spin}deg) translateZ(${size * 7}px)` },
  ], { duration: ms(INTRO), easing: "linear" });
  run(scene, [{ opacity: 1 }, { opacity: 1, offset: 0.84 }, { opacity: 0 }], { duration: ms(INTRO) });

  // letters fly out of the depth, tumbling, one after another
  letters.forEach(({ L }, i) => {
    const r = (n: number) => Math.sin((i + 1) * n);
    run(L, [
      { transform: `translate3d(${r(3.1) * size * 2}px, ${r(5.7) * size * 1.6}px, ${-size * 22}px) rotateX(${r(2.3) * 160}deg) rotateY(${r(4.1) * 140}deg) rotateZ(${r(1.7) * 50}deg)`, opacity: 0 },
      { opacity: 1, offset: 0.25 },
      { transform: "translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)", opacity: 1 },
    ], { duration: 900, delay: 60 + i * 70, easing: EASE_OUT });
  });
  const landed = 60 + (letters.length - 1) * 70 + 900;
  if (hq) run(hq, [{ transform: "translate3d(0, -40%, 220px) scale(0.4) rotateX(-70deg)", opacity: 0 }, { transform: "translate3d(0,0,0) scale(1) rotateX(0deg)", opacity: 1 }], { duration: 520, delay: landed - 200, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
  letters.forEach(({ face }, i) => run(face, [{ backgroundPosition: "100% 0" }, { backgroundPosition: "0% 0" }], { duration: 650, delay: landed - 360 + i * 50, easing: "ease-in-out" }));

  // tiles swing in from the depth after the letters start landing, float, then burst outward
  tiles.forEach((el, i) => {
    const z = Number(el.dataset.z), side = el.offsetLeft < 0 ? -1 : 1, d = 420 + i * 110;
    const at = `translateZ(${z}px) rotateY(${side * -14}deg)`;
    run(el, [
      { transform: `translateZ(${z - 900}px) rotateY(${side * 70}deg) rotateX(20deg) scale(0.7)`, opacity: 0 },
      { opacity: 1, offset: 0.3 },
      { transform: `${at} rotateX(0deg) scale(1)`, opacity: 1 },
    ], { duration: 900, delay: d, easing: EASE_OUT });
    run(el, [
      { transform: `${at} translateY(0px)` },
      { transform: `${at} translateY(${(i % 2 ? -1 : 1) * size * 0.08}px)` },
      { transform: `${at} translateY(0px)` },
    ], { duration: 1400, delay: d + 900, iterations: 1, easing: "ease-in-out", composite: "replace" });
    run(el, [
      { transform: `${at}`, opacity: 1 },
      { transform: `translateZ(${z + 500}px) translateX(${side * o.W * 0.5}px) rotateY(${side * -50}deg) scale(1.2)`, opacity: 0 },
    ], { duration: 520, delay: ms(INTRO_HANDOFF) - 380 + i * 30, easing: "cubic-bezier(0.7, 0, 0.84, 0)" });
  });

  const t0 = setTimeout(() => o.sfx.pop?.(), 520);
  const t1 = setTimeout(() => o.sfx.hit(), landed - 120);
  const t2 = setTimeout(() => o.sfx.whoosh(0.9), ms(INTRO_HANDOFF) - 200);

  return new Promise((res) => setTimeout(() => {
    [t0, t1, t2].forEach(clearTimeout);
    anims.forEach((a) => a.cancel());
    host.innerHTML = "";
    res();
  }, ms(INTRO) + 50));
}
