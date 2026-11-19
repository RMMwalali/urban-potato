// Reel timeline: every frame is drawn on a canvas from the current time, so preview and recording match exactly.
import type { Hit } from "./score";

export type ReelConfig = {
  name: string; // platform name (DARLING)
  domain: string; // shown on the last card
  currency: string;
  price: number;
  trialDays: number;
  offer: { enabled: boolean; percent: number; months: number; slots: number; left: number };
};

type Ctx = CanvasRenderingContext2D;
type Scene = { id: string; dur: number; bg: "ink" | "paper"; draw: (c: Ctx, lt: number, s: Stage) => void };
type Stage = { W: number; H: number; u: number; tall: boolean; cfg: ReelConfig };

const INK = "#1c1f24", PAPER = "#ededed", PANEL = "#f8f8f8", PINK = "#d9468a", BLUE = "#1f5277", MUTED = "#6b6f76";
const FONT = '"Geist Variable", Geist, ui-sans-serif, system-ui, sans-serif';

/* ---------- easing & helpers ---------- */
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const outBack = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function font(c: Ctx, size: number, weight = 500) {
  c.font = `${weight} ${size}px ${FONT}`;
}
function text(c: Ctx, s: string, x: number, y: number, size: number, o: { weight?: number; color?: string; align?: CanvasTextAlign; alpha?: number; spacing?: number } = {}) {
  font(c, size, o.weight ?? 500);
  c.fillStyle = o.color ?? INK;
  c.textAlign = o.align ?? "left";
  c.textBaseline = "alphabetic";
  c.globalAlpha = o.alpha ?? 1;
  (c as Ctx & { letterSpacing?: string }).letterSpacing = `${o.spacing ?? 0}px`;
  c.fillText(s, x, y);
  (c as Ctx & { letterSpacing?: string }).letterSpacing = "0px";
  c.globalAlpha = 1;
}
/** Font size that makes `s` exactly `width` wide. */
function fit(c: Ctx, s: string, width: number, weight = 600) {
  font(c, 100, weight);
  return (100 * width) / c.measureText(s).width;
}
/** Uppercase lines that slide up from behind a mask, the site's signature reveal. */
function maskedLines(c: Ctx, lines: string[], x: number, y: number, size: number, lt: number, o: { delay?: number; color?: string; weight?: number; lh?: number; align?: CanvasTextAlign } = {}) {
  const lh = size * (o.lh ?? 0.92);
  lines.forEach((l, i) => {
    const p = outExpo(seg(lt, (o.delay ?? 0) + i * 0.09, (o.delay ?? 0) + i * 0.09 + 0.7));
    const ly = y + i * lh;
    c.save();
    c.beginPath(); c.rect(0, ly - size * 0.95, c.canvas.width, size * 1.12); c.clip();
    text(c, l, x, ly + (1 - p) * size * 1.1, size, { weight: o.weight ?? 500, color: o.color, align: o.align });
    c.restore();
  });
}
function label(c: Ctx, s: string, x: number, y: number, st: Stage, color = INK, alpha = 1) {
  text(c, s.toUpperCase(), x, y, 30 * st.u, { weight: 500, color, spacing: 3 * st.u, alpha });
}
function rrect(c: Ctx, x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, lw = 3) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
function shake(lt: number, at: number, amp: number) {
  const k = seg(lt, at, at + 0.45);
  if (k <= 0 || k >= 1) return [0, 0];
  const a = amp * (1 - k) * (1 - k);
  return [Math.sin(lt * 90) * a, Math.cos(lt * 77) * a];
}

/** Phone frame; returns the screen rectangle. */
function phone(c: Ctx, st: Stage, lt: number) {
  const { W, H, u, tall } = st;
  const top = tall ? H * 0.31 : H * 0.18, bottom = tall ? H * 0.84 : H * 0.92;
  const h = bottom - top, w = Math.min(h * 0.56, W * 0.7);
  const x = (W - w) / 2;
  const p = outExpo(seg(lt, 0.1, 0.8));
  c.save();
  c.translate(W / 2, top + h / 2); c.scale(0.92 + 0.08 * p, 0.92 + 0.08 * p); c.translate(-W / 2, -(top + h / 2));
  c.globalAlpha = p;
  rrect(c, x, top + (1 - p) * 60 * u, w, h, 54 * u, INK);
  const pad = 18 * u;
  const scr = { x: x + pad, y: top + pad + (1 - p) * 60 * u, w: w - pad * 2, h: h - pad * 2 };
  rrect(c, scr.x, scr.y, scr.w, scr.h, 40 * u, PANEL);
  c.restore();
  return { ...scr, alpha: p };
}

function caption(c: Ctx, st: Stage, lt: number, s: string) {
  const p = outExpo(seg(lt, 0.9, 1.6));
  text(c, s, st.W / 2, st.tall ? st.H * 0.93 : st.H * 0.97, 44 * st.u, { align: "center", alpha: p, color: INK, weight: 500 });
}

function featureHeader(c: Ctx, st: Stage, lt: number, n: string, title: string[]) {
  const { W, H, u, tall } = st;
  const x = 70 * u;
  label(c, `${n} / ${st.cfg.name}`, x, (tall ? H * 0.075 : H * 0.1), st, MUTED, outExpo(seg(lt, 0, 0.5)));
  const size = tall ? 118 * u : 96 * u;
  maskedLines(c, title, x, tall ? H * 0.14 : H * 0.2, size, lt, { delay: 0.05 });
  // rule
  const rp = outExpo(seg(lt, 0.2, 1));
  c.fillStyle = INK; c.fillRect(x, (tall ? H * 0.14 : H * 0.2) + size * (title.length - 0.6) + 26 * u, (W - x * 2) * rp, 4 * u);
}

/* ---------- scenes ---------- */
function scenes(cfg: ReelConfig): Scene[] {
  const list: Scene[] = [
    {
      id: "say-no-more", dur: 3.6, bg: "ink",
      draw(c, lt, st) {
        const { W, H, u, tall } = st;
        const hits = [0.15, 1.2, 2.25];
        const phase = hits.filter((h) => lt >= h).length;
        if (phase === 0) return;
        const hitT = hits[phase - 1];
        const punch = 1 + 0.28 * (1 - outExpo(seg(lt, hitT, hitT + 0.3)));
        const [sx, sy] = shake(lt, hitT, (phase === 3 ? 46 : 26) * u);
        const widths = [0.46, 0.7, 1.02];
        const zoom = lt > 3.25 ? 1 + Math.pow(seg(lt, 3.25, 3.6), 3) * 7 : 1;
        c.save();
        c.translate(W / 2 + sx, H / 2 + sy); c.scale(punch * zoom, punch * zoom); c.rotate((phase === 3 ? Math.sin(lt * 40) * 0.006 : 0));
        const lines = tall ? ["SAY", "NO", "MORE"] : ["SAY NO MORE"];
        const target = W * widths[phase - 1];
        const sizes = lines.map((l) => fit(c, l, target, 700));
        const total = sizes.reduce((a, s) => a + s * 0.86, 0);
        let y = -total / 2;
        lines.forEach((l, i) => {
          y += sizes[i] * 0.86;
          if (phase === 3) {
            text(c, l, -10 * u, y, sizes[i], { weight: 700, color: PINK, align: "center", alpha: 0.85 });
            text(c, l, 10 * u, y, sizes[i], { weight: 700, color: BLUE, align: "center", alpha: 0.85 });
          }
          text(c, l, 0, y, sizes[i], { weight: 700, color: PAPER, align: "center" });
        });
        c.restore();
        // impact flash
        const flash = 1 - seg(lt, hitT, hitT + 0.16);
        if (flash > 0) { c.fillStyle = phase === 3 ? PINK : PAPER; c.globalAlpha = flash * (phase === 3 ? 0.55 : 0.35); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
        // vignette bars
        c.fillStyle = INK; c.globalAlpha = 0.35; c.fillRect(0, 0, W, 40 * u); c.fillRect(0, H - 40 * u, W, 40 * u); c.globalAlpha = 1;
        if (lt > 3.3) { c.fillStyle = PAPER; c.globalAlpha = seg(lt, 3.3, 3.6); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      },
    },
    {
      id: "positioning", dur: 3.4, bg: "paper",
      draw(c, lt, st) {
        const { W, H, u, tall } = st;
        const x = 70 * u;
        const size = tall ? fit(c, "A BOOKING", W - x * 2, 500) : 150 * u;
        const y0 = tall ? H * 0.36 : H * 0.38;
        maskedLines(c, tall ? ["NOT A", "WEBSITE."] : ["NOT A WEBSITE."], x, y0, size, lt);
        // strike-through on WEBSITE
        const sp = inOut(seg(lt, 0.9, 1.4));
        if (sp > 0) {
          font(c, size, 500);
          const wy = y0 + (tall ? size * 0.92 : 0) - size * 0.32;
          const ww = c.measureText(tall ? "WEBSITE" : "NOT A WEBSITE").width;
          c.fillStyle = PINK; c.fillRect(x, wy, ww * sp, 16 * u);
        }
        maskedLines(c, tall ? ["A BOOKING", "ENGINE."] : ["A BOOKING ENGINE."], x, y0 + size * (tall ? 2.15 : 1.15), size, lt, { delay: 1.3, color: BLUE });
        label(c, "Salons don't need websites. They need bookings.", x, tall ? H * 0.9 : H * 0.92, st, MUTED, outExpo(seg(lt, 1.9, 2.5)));
      },
    },
    {
      id: "booking", dur: 4, bg: "paper",
      draw(c, lt, st) {
        const { u } = st;
        featureHeader(c, st, lt, "01", ["ONLINE", "BOOKING"]);
        const s = phone(c, st, lt);
        const px = s.x + 36 * u; let y = s.y + 80 * u;
        label(c, "Book online", px, y, st, MUTED, s.alpha); y += 70 * u;
        const rows = [["Knotless braids", "6,000"], ["Silk press", "2,500"], ["Gel manicure", "1,500"]];
        const tapRow = lt >= 1.2;
        rows.forEach(([n, p], i) => {
          const a = outExpo(seg(lt, 0.45 + i * 0.12, 0.95 + i * 0.12));
          const sel = tapRow && i === 1;
          rrect(c, px - 10 * u, y - 52 * u + (1 - a) * 30 * u, s.w - 52 * u, 84 * u, 18 * u, sel ? "#fbe9f1" : "#ffffff", sel ? PINK : "#d7d7d7", sel ? 4 * u : 2 * u);
          text(c, n, px + 14 * u, y + (1 - a) * 30 * u, 34 * u, { alpha: a });
          text(c, `KES ${p}`, px + s.w - 82 * u, y + (1 - a) * 30 * u, 32 * u, { align: "right", alpha: a, weight: 600 });
          y += 100 * u;
        });
        // tap ripple
        const rp = seg(lt, 1.2, 1.6);
        if (rp > 0 && rp < 1) { c.strokeStyle = PINK; c.globalAlpha = 1 - rp; c.lineWidth = 6 * u; c.beginPath(); c.arc(s.x + s.w * 0.55, s.y + 80 * u + 70 * u + 100 * u - 12 * u, 20 * u + rp * 90 * u, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
        // slots
        y += 20 * u;
        const slots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
        const cw = (s.w - 72 * u - 20 * u) / 3;
        slots.forEach((t, i) => {
          const a = outBack(seg(lt, 1.6 + i * 0.05, 2.0 + i * 0.05));
          if (a <= 0) return;
          const cx = px - 10 * u + (i % 3) * (cw + 10 * u), cy = y + Math.floor(i / 3) * 86 * u;
          const on = lt >= 2.3 && i === 2;
          c.save(); c.translate(cx + cw / 2, cy + 34 * u); c.scale(a, a); c.translate(-(cx + cw / 2), -(cy + 34 * u));
          rrect(c, cx, cy, cw, 70 * u, 35 * u, on ? PINK : "#ffffff", on ? undefined : "#d7d7d7", 2 * u);
          text(c, t, cx + cw / 2, cy + 46 * u, 30 * u, { align: "center", color: on ? "#fff" : INK, weight: 600 });
          c.restore();
        });
        // booked button
        const bp = outBack(seg(lt, 2.75, 3.15));
        if (bp > 0) {
          const by = s.y + s.h - 150 * u;
          c.save(); c.translate(s.x + s.w / 2, by + 45 * u); c.scale(bp, bp); c.translate(-(s.x + s.w / 2), -(by + 45 * u));
          rrect(c, px - 10 * u, by, s.w - 52 * u, 92 * u, 46 * u, INK);
          text(c, "BOOKED  ✓", s.x + s.w / 2, by + 60 * u, 36 * u, { align: "center", color: PAPER, weight: 600, spacing: 2 * u });
          c.restore();
        }
        caption(c, st, lt, "Clients book themselves. 24/7. No app.");
      },
    },
    {
      id: "mpesa", dur: 4, bg: "paper",
      draw(c, lt, st) {
        const { u } = st;
        featureHeader(c, st, lt, "02", ["M-PESA", "CHECKOUT"]);
        const s = phone(c, st, lt);
        const px = s.x + 36 * u; let y = s.y + 90 * u;
        label(c, "Payment · KES 1,500", px, y, st, MUTED, s.alpha); y += 60 * u;
        rrect(c, px - 10 * u, y, s.w - 52 * u, 96 * u, 16 * u, "#ffffff", INK, 3 * u);
        const code = "UKFKZ2BK5P";
        const n = Math.floor(clamp((lt - 0.55) / 1.1) * code.length);
        font(c, 44 * u, 600);
        text(c, code.slice(0, n), px + 14 * u, y + 64 * u, 44 * u, { weight: 600, spacing: 4 * u });
        const cw = (() => { font(c, 44 * u, 600); return c.measureText(code.slice(0, n)).width + n * 4 * u; })();
        if (Math.floor(lt * 3) % 2 === 0 && lt < 2) { c.fillStyle = INK; c.fillRect(px + 18 * u + cw, y + 22 * u, 4 * u, 52 * u); }
        y += 140 * u;
        const vp = outExpo(seg(lt, 1.85, 2.5));
        if (vp > 0) {
          const oy = (1 - vp) * 60 * u;
          rrect(c, px - 10 * u, y + oy, s.w - 52 * u, 330 * u, 22 * u, "#e8eef3");
          c.globalAlpha = vp;
          label(c, "Confirmed by Safaricom", px + 16 * u, y + 64 * u + oy, st, BLUE);
          text(c, "Mary Wanjiku", px + 16 * u, y + 150 * u + oy, 50 * u, { weight: 600 });
          text(c, "KES 1,500", px + 16 * u, y + 222 * u + oy, 50 * u, { weight: 500, color: BLUE });
          text(c, "Code can only be used once", px + 16 * u, y + 290 * u + oy, 28 * u, { color: MUTED });
          c.globalAlpha = 1;
        }
        const sp = outBack(seg(lt, 2.8, 3.2));
        if (sp > 0) {
          const by = s.y + s.h - 150 * u;
          c.save(); c.translate(s.x + s.w / 2, by + 45 * u); c.scale(sp, sp); c.translate(-(s.x + s.w / 2), -(by + 45 * u));
          rrect(c, px - 10 * u, by, s.w - 52 * u, 92 * u, 46 * u, INK);
          text(c, "PAID  ✓", s.x + s.w / 2, by + 60 * u, 36 * u, { align: "center", color: PAPER, weight: 600, spacing: 2 * u });
          c.restore();
        }
        caption(c, st, lt, "Type the code. Name & amount fill in.");
      },
    },
    {
      id: "reminders", dur: 4, bg: "paper",
      draw(c, lt, st) {
        const { u } = st;
        featureHeader(c, st, lt, "03", ["REMINDERS", "THAT SEND"]);
        const s = phone(c, st, lt);
        const bubbles: [number, string[], boolean][] = [
          [0.45, ["Reminder: Akinyi, see you", "tomorrow 10:00 for knotless", "braids at Glow Studio."], false],
          [1.35, ["Can't make it? Change it", "in one tap: darling/b/…"], false],
          [2.3, ["Moved to Saturday 11:00 ✓"], true],
        ];
        let y = s.y + 70 * u;
        label(c, "SMS · WhatsApp", s.x + 36 * u, y, st, MUTED, s.alpha); y += 40 * u;
        for (const [at, lines, me] of bubbles) {
          const a = outBack(seg(lt, at, at + 0.4));
          const h = lines.length * 46 * u + 40 * u;
          if (a > 0) {
            const bw = s.w * 0.78, bx = me ? s.x + s.w - bw - 28 * u : s.x + 28 * u;
            c.save(); c.translate(me ? bx + bw : bx, y + h / 2); c.scale(a, a); c.translate(-(me ? bx + bw : bx), -(y + h / 2));
            rrect(c, bx, y, bw, h, 26 * u, me ? PINK : "#ffffff", me ? undefined : "#d7d7d7", 2 * u);
            lines.forEach((l, i) => text(c, l, bx + 24 * u, y + 56 * u + i * 46 * u, 31 * u, { color: me ? "#fff" : INK }));
            c.restore();
          }
          y += h + 30 * u;
        }
        caption(c, st, lt, "Confirmations, reminders, self-reschedule.");
      },
    },
    {
      id: "deposits", dur: 4, bg: "paper",
      draw(c, lt, st) {
        const { W, H, u, tall } = st;
        featureHeader(c, st, lt, "04", ["DEPOSITS.", "NO NO-SHOWS."]);
        const at = 0.55;
        const p = outExpo(seg(lt, at, at + 0.35));
        const [sx, sy] = shake(lt, at + 0.05, 24 * u);
        if (p > 0) {
          const size = fit(c, "KES 500", W * 0.78, 700);
          c.save(); c.translate(W / 2 + sx, (tall ? H * 0.56 : H * 0.6) + sy); c.scale(2.4 - 1.4 * p, 2.4 - 1.4 * p); c.rotate(-0.06 * p);
          c.globalAlpha = p;
          rrect(c, -W * 0.43, -size * 0.92, W * 0.86, size * 1.2, 24 * u, undefined, PINK, 10 * u);
          text(c, "KES 500", 0, 0, size, { weight: 700, color: PINK, align: "center" });
          c.restore();
          c.globalAlpha = 1;
        }
        const y = tall ? H * 0.7 : H * 0.8;
        maskedLines(c, ["Deposit paid by M-Pesa.", "Comes off the bill."], W / 2, y, 52 * u, lt, { delay: 1.4, align: "center", weight: 500 });
        label(c, "Repeat no-shows flagged automatically", 70 * u, tall ? H * 0.86 : H * 0.95, st, MUTED, outExpo(seg(lt, 2.2, 2.8)));
      },
    },
    {
      id: "clients", dur: 4, bg: "paper",
      draw(c, lt, st) {
        const { W, H, u, tall } = st;
        featureHeader(c, st, lt, "05", ["CLIENT", "RECORDS"]);
        const x = 70 * u, w = W - x * 2, top = tall ? H * 0.34 : H * 0.36;
        const p = outExpo(seg(lt, 0.2, 0.8));
        rrect(c, x, top + (1 - p) * 50 * u, w, (tall ? H * 0.46 : H * 0.5), 26 * u, "#ffffff");
        c.globalAlpha = p;
        text(c, "WANJIKU M.", x + 50 * u, top + 110 * u, 72 * u, { weight: 600 });
        text(c, "+254 7•• ••• 222", x + 50 * u, top + 165 * u, 32 * u, { color: MUTED });
        c.globalAlpha = 1;
        const tp = outBack(seg(lt, 0.9, 1.3));
        if (tp > 0) {
          c.save(); c.translate(x + 50 * u, top + 230 * u); c.scale(tp, tp);
          rrect(c, 0, 0, 560 * u, 70 * u, 35 * u, "#fbe9f1", PINK, 3 * u);
          text(c, "ALLERGY: SENSITIVE SCALP", 30 * u, 47 * u, 28 * u, { color: PINK, weight: 600, spacing: 2 * u });
          c.restore();
        }
        const rows = [["Visits", "12"], ["Last service", "Silk press"], ["Prefers", "Erin · medium tension"], ["Spent", "KES 31,800"]];
        rows.forEach(([k, v], i) => {
          const a = outExpo(seg(lt, 1.3 + i * 0.15, 1.8 + i * 0.15));
          const ry = top + 380 * u + i * 92 * u;
          c.globalAlpha = a;
          c.fillStyle = "#e3e3e3"; c.fillRect(x + 50 * u, ry - 54 * u, w - 100 * u, 2 * u);
          text(c, k.toUpperCase(), x + 50 * u, ry, 26 * u, { color: MUTED, spacing: 2 * u });
          text(c, v, x + w - 50 * u, ry, 36 * u, { align: "right", weight: 500 });
          c.globalAlpha = 1;
        });
        caption(c, st, lt, "Owned by the salon. Export any time.");
      },
    },
    {
      id: "reports", dur: 4, bg: "paper",
      draw(c, lt, st) {
        const { W, H, u, tall } = st;
        featureHeader(c, st, lt, "06", ["REPORTS &", "EARNINGS"]);
        const x = 70 * u, w = W - x * 2, base = tall ? H * 0.66 : H * 0.72, maxH = tall ? H * 0.22 : H * 0.28;
        const heights = [0.42, 0.58, 0.5, 0.74, 0.66, 0.92, 1];
        const bw = w / heights.length - 18 * u;
        heights.forEach((h, i) => {
          const g = outExpo(seg(lt, 0.4 + i * 0.07, 1.2 + i * 0.07));
          c.fillStyle = i === heights.length - 1 ? PINK : INK;
          c.fillRect(x + i * (bw + 18 * u), base - maxH * h * g, bw, maxH * h * g);
        });
        c.fillStyle = INK; c.fillRect(x, base + 8 * u, w, 4 * u);
        const total = Math.round(84500 * outExpo(seg(lt, 0.5, 2)));
        text(c, `KES ${total.toLocaleString()}`, x, (tall ? H * 0.38 : H * 0.42), 96 * u, { weight: 600 });
        label(c, "This week", x, (tall ? H * 0.38 : H * 0.42) + 50 * u, st, MUTED);
        maskedLines(c, ["Erin earned KES 12,300", "commission + tips"], x, base + 110 * u, 46 * u, lt, { delay: 1.9 });
        caption(c, st, lt, "Daily takings. Staff pay. Till sheet.");
      },
    },
  ];

  if (cfg.offer.enabled) {
    list.push({
      id: "offer", dur: 3.6, bg: "ink",
      draw(c, lt, st) {
        const { W, H, u, tall } = st;
        const x = 70 * u;
        label(c, "Founding offer", x, tall ? H * 0.2 : H * 0.16, st, PINK, outExpo(seg(lt, 0, 0.4)));
        const at = 0.25;
        const p = outExpo(seg(lt, at, at + 0.3));
        const [sx, sy] = shake(lt, at, 30 * u);
        const big = `${cfg.offer.percent}% OFF`;
        const size = fit(c, big, W - x * 2, 700);
        c.save(); c.translate(W / 2 + sx, (tall ? H * 0.42 : H * 0.48) + sy); c.scale(1.8 - 0.8 * p, 1.8 - 0.8 * p);
        c.globalAlpha = p;
        text(c, big, 0, 0, size, { weight: 700, color: PAPER, align: "center" });
        c.restore(); c.globalAlpha = 1;
        maskedLines(c, [`FIRST ${cfg.offer.months} MONTHS`, `FIRST ${cfg.offer.slots} SALONS`], x, tall ? H * 0.58 : H * 0.68, tall ? 92 * u : 80 * u, lt, { delay: 0.9, color: PAPER });
        label(c, `${cfg.offer.left} places left · counts when you subscribe`, x, tall ? H * 0.82 : H * 0.92, st, "#b9bcc2", outExpo(seg(lt, 1.8, 2.4)));
      },
    });
  } else {
    list.push({
      id: "price", dur: 3.6, bg: "ink",
      draw(c, lt, st) {
        const { W, H, u, tall } = st;
        const x = 70 * u;
        maskedLines(c, ["ONE PRICE.", "NO COMMISSION."], x, tall ? H * 0.32 : H * 0.3, tall ? 110 * u : 96 * u, lt, { color: PAPER });
        const s = `${cfg.currency} ${cfg.price.toLocaleString()}`;
        const size = fit(c, s, W - x * 2, 700);
        text(c, s, x, tall ? H * 0.6 : H * 0.7, size, { weight: 700, color: PAPER, alpha: outExpo(seg(lt, 0.9, 1.5)) });
        label(c, "per month · unlimited staff", x, tall ? H * 0.66 : H * 0.8, st, "#b9bcc2", outExpo(seg(lt, 1.4, 2)));
      },
    });
  }

  list.push({
    id: "cta", dur: 4.6, bg: "paper",
    draw(c, lt, st) {
      const { W, H, u, tall } = st;
      const name = cfg.name.toUpperCase();
      const x = 70 * u;
      const size = fit(c, name, W - x * 2, 700);
      const p = outExpo(seg(lt, 0.05, 0.6));
      const [sx, sy] = shake(lt, 0.05, 22 * u);
      c.save(); c.translate(sx, sy + (1 - p) * 80 * u); c.globalAlpha = p;
      font(c, size, 700);
      const word = name.replace(/\s+HQ$/i, ""), head = word.slice(0, 3), tail = word.slice(3) + (word === name ? "" : " HQ");
      const hw = c.measureText(head).width;
      const y = tall ? H * 0.42 : H * 0.45;
      text(c, head, x, y, size, { weight: 700, color: BLUE });
      text(c, tail, x + hw, y, size, { weight: 700, color: PINK });
      c.restore(); c.globalAlpha = 1;
      maskedLines(c, ["Not a website.", "A booking engine."], x, y + 140 * u, tall ? 74 * u : 64 * u, lt, { delay: 0.6 });
      const bp = outBack(seg(lt, 1.5, 1.9));
      if (bp > 0) {
        const bw = W - x * 2, by = tall ? H * 0.72 : H * 0.78;
        c.save(); c.translate(W / 2, by + 60 * u); c.scale(bp, bp); c.translate(-W / 2, -(by + 60 * u));
        rrect(c, x, by, bw, 120 * u, 60 * u, INK);
        text(c, `START YOUR ${cfg.trialDays}-DAY FREE TRIAL`, W / 2, by + 76 * u, 40 * u, { align: "center", color: PAPER, weight: 600, spacing: 2 * u });
        c.restore();
      }
      label(c, cfg.domain, W / 2 - 0, tall ? H * 0.86 : H * 0.94, st, INK, outExpo(seg(lt, 2.1, 2.7)));
      c.textAlign = "left";
    },
  });
  return list;
}

/* ---------- timeline ---------- */
export function buildReel(cfg: ReelConfig) {
  const list = scenes(cfg);
  let t = 0;
  const timed = list.map((s) => { const r = { ...s, start: t }; t += s.dur; return r; });
  const length = t;
  // orchestral hits: the three SAY NO MORE slams, then every scene change except the last (the score ends on its own final chord)
  const hits: Hit[] = [{ t: 0.15 }, { t: 1.2 }, { t: 2.25, big: true }, ...timed.slice(1, -1).map((s) => ({ t: s.start, big: s.id === "offer" || s.id === "price" }))];
  const finalAt = timed[timed.length - 1].start;

  function render(c: Ctx, time: number, W: number, H: number) {
    const st: Stage = { W, H, u: Math.min(W, H) / 1080, tall: H > W * 1.2, cfg };
    const tt = clamp(time, 0, length - 0.0001);
    const cur = timed.find((s) => tt >= s.start && tt < s.start + s.dur) ?? timed[timed.length - 1];
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = cur.bg === "ink" ? INK : PAPER;
    c.fillRect(0, 0, W, H);
    cur.draw(c, tt - cur.start, st);
    // wipe transition around each scene boundary (skip the intro, which zooms through)
    for (const s of timed.slice(2)) {
      const d = tt - s.start;
      if (d > -0.22 && d < 0.22) {
        const k = (d + 0.22) / 0.44;
        c.fillStyle = s.bg === "ink" ? PAPER : INK;
        if (k < 0.5) { const h = H * inOut(k * 2); c.fillRect(0, H - h, W, h); }
        else { const h = H * (1 - inOut((k - 0.5) * 2)); c.fillRect(0, 0, W, h); }
      }
    }
  }

  return { length, hits, finalAt, render, scenes: timed.map((s) => ({ id: s.id, start: s.start, dur: s.dur })) };
}
