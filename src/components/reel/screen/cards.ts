// Text cards around each demo: what Laazizi HQ is and what this video shows (after the 3D logo), and where to
// find it (at the end). Lines swing up out of the depth one after another, hold, then tip away.

type Line = { brand?: boolean; text: string; size: number; weight?: number; caps?: boolean; tone?: "ink" | "muted" | "blue" | "pink"; gap?: number; track?: number };
type CardOpts = { light: boolean; W: number; H: number; hold: number; align?: "left" | "center"; sfx?: { pop(): void } };

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN = "cubic-bezier(0.7, 0, 0.84, 0)";

/** Shows a card of lines inside `host` for `hold` seconds (plus its entrance and exit). Resolves when it's gone. */
export function playCard(host: HTMLElement, lines: Line[], o: CardOpts): Promise<void> {
  const col = {
    ink: o.light ? "#1c1f24" : "#ededed",
    muted: o.light ? "rgba(28,31,36,0.62)" : "rgba(237,237,237,0.66)",
    blue: o.light ? "#1f5277" : "#4f9cf0",
    pink: o.light ? "#d9468a" : "#f06fae",
  };
  const pad = Math.round(o.W * 0.09);
  const scene = document.createElement("div");
  scene.style.cssText = `position:absolute;inset:0;perspective:${Math.round(o.W * 1.6)}px;perspective-origin:50% 40%;pointer-events:none;display:flex;align-items:center;justify-content:${o.align === "center" ? "center" : "flex-start"};padding:0 ${pad}px`;
  const card = document.createElement("div");
  card.style.cssText = `transform-style:preserve-3d;max-width:${o.W - pad * 2}px;text-align:${o.align ?? "left"}`;
  scene.appendChild(card);
  const els = lines.map((l) => {
    const wrap = document.createElement("div");
    wrap.style.cssText = `overflow:visible;margin-top:${l.gap ?? 0}px;transform-style:preserve-3d`;
    const el = document.createElement("div");
    if (l.brand) {
      // the wordmark's colours: first three letters blue, the rest pink
      const m = l.text.trim().match(/^(.*?)\s+(HQ)$/i), word = m ? m[1] : l.text;
      const a = document.createElement("span"); a.textContent = word.slice(0, 3); a.style.color = col.blue;
      const b = document.createElement("span"); b.textContent = word.slice(3); b.style.color = col.pink;
      el.append(a, b);
      if (m) { const q = document.createElement("span"); q.textContent = "HQ"; q.style.cssText = `font-size:0.34em;vertical-align:top;margin-left:0.07em;letter-spacing:0;color:${col.ink}`; el.append(q); }
    } else el.textContent = l.text;
    el.style.cssText = `font-size:${l.size}px;line-height:1.08;font-weight:${l.weight ?? 400};color:${col[l.tone ?? "ink"]};${l.caps ? "text-transform:uppercase;" : ""}letter-spacing:${l.track ?? (l.caps ? -0.01 : 0)}em;transform-origin:50% 100%;opacity:0;backface-visibility:hidden`;
    wrap.appendChild(el);
    card.appendChild(wrap);
    return el;
  });
  host.appendChild(scene);

  const anims: Animation[] = [];
  const inMs = 850, step = 140, outMs = 520;
  els.forEach((el, i) => {
    anims.push(el.animate([
      { transform: "translate3d(0, 0.9em, -160px) rotateX(-82deg)", opacity: 0 },
      { transform: "translate3d(0, 0, 0) rotateX(0deg)", opacity: 1 },
    ], { duration: inMs, delay: i * step, easing: EASE_OUT, fill: "forwards" }));
  });
  // a slow drift while it holds, so the card feels like an object in space
  const total = inMs + (els.length - 1) * step + o.hold * 1000 + outMs + (els.length - 1) * 60;
  anims.push(card.animate([{ transform: "rotateY(-5deg) rotateX(3deg)" }, { transform: "rotateY(4deg) rotateX(-1deg)" }], { duration: total, easing: "ease-in-out", fill: "forwards" }));
  const outAt = inMs + (els.length - 1) * step + o.hold * 1000;
  els.forEach((el, i) => {
    anims.push(el.animate([
      { transform: "translate3d(0, 0, 0) rotateX(0deg)", opacity: 1 },
      { transform: "translate3d(0, -0.6em, -120px) rotateX(70deg)", opacity: 0 },
    ], { duration: outMs, delay: outAt + i * 60, easing: EASE_IN, fill: "forwards" }));
  });
  o.sfx?.pop();
  // remove only this card: the next one may already be on its way in
  return new Promise((res) => setTimeout(() => { anims.forEach((a) => a.cancel()); scene.remove(); res(); }, total + 30));
}

/** How long a card with this many lines and this hold takes, in seconds. */
export const cardLength = (lines: number, hold: number) => (850 + (lines - 1) * 140 + hold * 1000 + 520 + (lines - 1) * 60) / 1000;
