// The opening of every reel: the wordmark built from solid, extruded 3D letters that fly out of the depth,
// rings orbiting it, a light sweep as it lands, then it tips back and flies past the camera as the first
// screen comes through. Pure CSS 3D driven by the Web Animations API, so it's captured like everything else.

export const INTRO = 2.4; // seconds the intro lasts
export const INTRO_HANDOFF = 1.85; // when the reel's own entrance starts (the two overlap)

type Opts = { name: string; light: boolean; W: number; H: number; spin: 1 | -1; sfx: { whoosh(s?: number): void; hit(): void } };

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * k).toString(16).padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/** Builds the intro inside `host` (an empty layer over the stage), plays it, and resolves when it's done. */
export function playIntro(host: HTMLElement, o: Opts): Promise<void> {
  host.innerHTML = "";
  const blue = o.light ? "#1f5277" : "#4f9cf0", pink = o.light ? "#d9468a" : "#f06fae";
  const size = Math.round(Math.min(o.W * 0.19, o.H * 0.24));
  const STEP = 1.5;
  const depth = Math.max(16, Math.round((size * 0.26) / STEP)); // a deep, solid extrusion, in layers of 1.5px

  const scene = document.createElement("div");
  scene.style.cssText = `position:absolute;inset:0;perspective:${Math.round(size * 9)}px;perspective-origin:50% 46%;overflow:hidden;pointer-events:none`;
  const orbit = document.createElement("div");
  orbit.style.cssText = "position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d";
  scene.appendChild(orbit);

  // two thin rings on different axes
  const rings = [blue, pink].map((col, k) => {
    const ring = document.createElement("div");
    const d = size * (k ? 4.6 : 3.9);
    ring.style.cssText = `position:absolute;left:${-d / 2}px;top:${-d / 2}px;width:${d}px;height:${d}px;border-radius:50%;border:${Math.max(3, size / 34)}px solid ${col};opacity:0;transform-style:preserve-3d`;
    orbit.appendChild(ring);
    return ring;
  });

  // the wordmark: one solid letter per character
  const word = document.createElement("div");
  word.style.cssText = `position:absolute;left:0;top:0;display:flex;transform-style:preserve-3d;font-weight:600;font-size:${size}px;line-height:1;letter-spacing:-0.02em;text-transform:uppercase;white-space:pre`;
  word.className = "font-sans";
  const chars = [...o.name.toUpperCase()];
  const letters = chars.map((ch, i) => {
    const col = i < 3 ? blue : pink;
    const L = document.createElement("span");
    L.style.cssText = "position:relative;display:inline-block;transform-style:preserve-3d";
    // extruded body: stacked copies going back, darker with depth
    for (let k = depth; k >= 1; k--) {
      const s = document.createElement("span");
      s.textContent = ch;
      s.style.cssText = `position:absolute;left:0;top:0;color:${shade(col, k <= 2 ? 0.82 : 0.62 - (k / depth) * 0.3)};transform:translateZ(${-k * STEP}px)`;
      L.appendChild(s);
    }
    // front face, with a band of light that sweeps across on landing
    const face = document.createElement("span");
    face.textContent = ch;
    face.style.cssText = `position:relative;display:inline-block;color:transparent;background:linear-gradient(105deg, ${col} 0%, ${col} 42%, #ffffff 50%, ${col} 58%, ${col} 100%);background-size:320% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text`;
    L.appendChild(face);
    word.appendChild(L);
    return { L, face };
  });
  orbit.appendChild(word);
  const floor = document.createElement("div");
  const fw = size * chars.length * 0.62;
  floor.style.cssText = `position:absolute;left:${-fw / 2}px;top:${size * 0.42}px;width:${fw}px;height:${size * 1.2}px;border-radius:50%;background:radial-gradient(closest-side, rgba(0,0,0,${o.light ? 0.22 : 0.5}), rgba(0,0,0,0));transform:rotateX(90deg) translateZ(${-size * 0.1}px);transform-origin:50% 0;opacity:0`;
  orbit.insertBefore(floor, word);
  host.appendChild(scene);
  // centre the word on the orbit's origin
  const wb = word.getBoundingClientRect(), hb = host.getBoundingClientRect();
  const k = hb.width / (host.offsetWidth || hb.width) || 1; // the stage may be scaled on screen
  word.style.left = `${-wb.width / k / 2}px`; word.style.top = `${-wb.height / k / 2}px`;

  const ms = (s: number) => s * 1000;
  const anims: Animation[] = [];
  const run = (el: Element, kf: Keyframe[], opt: KeyframeAnimationOptions) => { const a = el.animate(kf, { fill: "forwards", ...opt }); anims.push(a); return a; };

  // the camera slowly orbits the whole time, then everything tips back and flies past
  run(orbit, [
    { transform: `rotateX(24deg) rotateY(${-48 * o.spin}deg) translateZ(-420px)` },
    { transform: `rotateX(14deg) rotateY(${-14 * o.spin}deg) translateZ(-60px)`, offset: 0.45 },
    { transform: `rotateX(10deg) rotateY(${18 * o.spin}deg) translateZ(0px)`, offset: 0.74 },
    { transform: `rotateX(-58deg) rotateY(${30 * o.spin}deg) translateZ(${size * 6}px)` },
  ], { duration: ms(INTRO), easing: "linear" });
  run(scene, [{ opacity: 1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: ms(INTRO) });

  // letters fly out of the depth, tumbling, one after another
  letters.forEach(({ L }, i) => {
    const r = (n: number) => Math.sin((i + 1) * n) ; // deterministic "random"
    run(L, [
      { transform: `translate3d(${r(3.1) * size * 2}px, ${r(5.7) * size * 1.6}px, ${-size * 22}px) rotateX(${r(2.3) * 160}deg) rotateY(${r(4.1) * 140}deg) rotateZ(${r(1.7) * 50}deg)`, opacity: 0 },
      { opacity: 1, offset: 0.25 },
      { transform: "translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)", opacity: 1 },
    ], { duration: 900, delay: 80 + i * 75, easing: EASE_OUT });
  });
  const landed = 80 + (letters.length - 1) * 75 + 900;

  run(floor, [{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: ms(INTRO) });

  // the light sweep, letter by letter
  letters.forEach(({ face }, i) => run(face, [{ backgroundPosition: "100% 0" }, { backgroundPosition: "0% 0" }], { duration: 650, delay: landed - 380 + i * 55, easing: "ease-in-out" }));

  // rings: spin in, keep turning, then open out like a portal
  rings.forEach((ring, k) => {
    const ax = k ? "rotateX(72deg) rotateY(-18deg)" : "rotateX(64deg) rotateY(22deg)";
    run(ring, [
      { transform: `${ax} rotateZ(0deg) scale(0.2)`, opacity: 0 },
      { transform: `${ax} rotateZ(${(k ? -1 : 1) * 160}deg) scale(1)`, opacity: 0.9, offset: 0.45 },
      { transform: `${ax} rotateZ(${(k ? -1 : 1) * 260}deg) scale(1.05)`, opacity: 0.9, offset: 0.74 },
      { transform: `${ax} rotateZ(${(k ? -1 : 1) * 330}deg) scale(4.5)`, opacity: 0 },
    ], { duration: ms(INTRO), delay: k * 90, easing: "cubic-bezier(0.45, 0, 0.2, 1)" });
  });

  // no sound while the letters arrive: a hit when they land, and air only when the logo actually flies past
  const t1 = setTimeout(() => o.sfx.hit(), landed - 120);
  const t2 = setTimeout(() => o.sfx.whoosh(0.9), ms(INTRO_HANDOFF) - 150);

  return new Promise((res) => setTimeout(() => {
    clearTimeout(t1); clearTimeout(t2);
    anims.forEach((a) => a.cancel());
    host.innerHTML = "";
    res();
  }, ms(INTRO) + 50));
}
