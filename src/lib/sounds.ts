// Notification sounds, synthesised live with Web Audio: original, playful UI sounds (no samples, nothing
// licensed). Browsers only let a page make sound after the person has interacted with it, so call
// unlockAudio() from a click/tap first; after that, sounds play whenever a notification arrives.

export type Tone = "booking" | "rescheduled" | "cancelled" | "payment" | "deposit" | "alert" | "test";
export const TONE_LABEL: Record<Tone, string> = { booking: "New booking", payment: "Payment received", deposit: "Deposit paid", rescheduled: "Rescheduled", cancelled: "Cancelled", alert: "Problem", test: "Test" };

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let master: GainNode | null = null;

function setup() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.8;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.2;
  // a small room so the tones feel polished rather than dry beeps
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 0.9);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = 0.18;
  bus = ctx.createGain();
  bus.connect(comp); bus.connect(verb).connect(wet).connect(comp);
  comp.connect(master).connect(ctx.destination);
  return ctx;
}

/** Call from a user gesture (click/tap/keypress) so later sounds are allowed to play. */
export async function unlockAudio() {
  const c = setup();
  if (c && c.state !== "running") await c.resume().catch(() => {});
  return c?.state === "running";
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}
function osc(type: OscillatorType, f: number, t: number, peak: number, attack: number, decay: number, dest: AudioNode) {
  const c = ctx!, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = f;
  env(g, t, peak, attack, decay);
  o.connect(g).connect(dest);
  o.start(t); o.stop(t + attack + decay + 0.05);
  return o;
}
// wooden mallet: fundamental plus a fast-dying 4th harmonic "knock"
function marimba(m: number, t: number, v = 0.5) {
  const f = hz(m);
  osc("sine", f, t, v, 0.003, 0.55, bus!);
  osc("sine", f * 4, t, v * 0.35, 0.002, 0.08, bus!);
  osc("sine", f * 10, t, v * 0.08, 0.001, 0.03, bus!);
}
// small bell: inharmonic partials ringing out
function bell(m: number, t: number, v = 0.35) {
  const f = hz(m);
  [[1, 1, 1.4], [2.76, 0.45, 0.9], [5.4, 0.22, 0.5], [8.93, 0.12, 0.3]].forEach(([r, a, d]) => osc("sine", f * r, t, v * a, 0.002, d, bus!));
}
function noise(t: number, dur: number, from: number, to: number, v: number) {
  const c = ctx!, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.4;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain(); env(g, t, v, 0.004, dur);
  s.connect(f).connect(g).connect(bus!); s.start(t); s.stop(t + dur + 0.05);
}

export function playTone(tone: Tone, volume = 0.8) {
  const c = setup();
  if (!c || !bus || !master || c.state !== "running") return false;
  master.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), c.currentTime);
  const t = c.currentTime + 0.02;
  switch (tone) {
    case "booking":
    case "test":
      // bright "ding-ding!" up a fifth, with a bell on top
      marimba(88, t, 0.5); marimba(95, t + 0.1, 0.55); bell(95, t + 0.1, 0.18);
      break;
    case "payment":
    case "deposit":
      // "cha-ching": a cash-drawer shimmer, then a quick major arpeggio and sparkle
      noise(t, 0.07, 7000, 3500, 0.35);
      noise(t + 0.08, 0.06, 8000, 4000, 0.25);
      [84, 88, 91, 96].forEach((m, i) => bell(m, t + 0.14 + i * 0.045, 0.22 + i * 0.03));
      [103, 108, 106].forEach((m, i) => osc("sine", hz(m), t + 0.36 + i * 0.05, 0.05, 0.002, 0.25, bus!));
      break;
    case "rescheduled":
      // three quick rising taps
      [79, 81, 86].forEach((m, i) => marimba(m, t + i * 0.085, 0.42));
      break;
    case "cancelled":
      // soft step down
      marimba(76, t, 0.38); marimba(71, t + 0.16, 0.34);
      break;
    case "alert":
      // two low pulses: noticeable without being alarming
      osc("triangle", hz(57), t, 0.38, 0.01, 0.16, bus!); osc("triangle", hz(57.15), t, 0.2, 0.01, 0.16, bus!);
      osc("triangle", hz(57), t + 0.2, 0.38, 0.01, 0.22, bus!); osc("triangle", hz(57.15), t + 0.2, 0.2, 0.01, 0.22, bus!);
      break;
  }
  return true;
}
