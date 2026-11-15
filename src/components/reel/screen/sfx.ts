// Interface sound design for the demos, synthesised with Web Audio (no samples, nothing licensed):
// mouse clicks, key taps, whooshes on page changes and camera moves, a soft pop for focus moments.

export type Sfx = { click(): void; key(): void; whoosh(dur?: number): void; pop(): void; hit(): void };
export const silentSfx: Sfx = { click() {}, key() {}, whoosh() {}, pop() {}, hit() {} };

export function makeSfx(ctx: AudioContext, out: AudioNode): Sfx {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const bus = ctx.createGain();
  bus.gain.value = 0.9;
  bus.connect(out);

  const noise = (t: number, dur: number, filter: BiquadFilterType, f0: number, f1: number, q: number, peak: number, attack = 0.002) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = ctx.createBiquadFilter();
    f.type = filter; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  };
  const tone = (t: number, dur: number, f0: number, f1: number, peak: number, type: OscillatorType = "sine") => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  };

  return {
    // a mouse button: a short bright tick plus a low body
    click() { const t = ctx.currentTime; noise(t, 0.035, "highpass", 3800, 2500, 0.7, 0.35); tone(t, 0.05, 900, 300, 0.12, "triangle"); },
    // a laptop key: softer, slightly random pitch
    key() { const t = ctx.currentTime; noise(t, 0.028, "bandpass", 2200 + Math.random() * 900, 1500, 1.2, 0.16); },
    // an air whoosh, rising then falling
    whoosh(dur = 0.55) { const t = ctx.currentTime; noise(t, dur, "bandpass", 400, 2600, 0.8, 0.22, dur * 0.45); },
    // a soft UI pop for focus moments
    pop() { const t = ctx.currentTime; tone(t, 0.16, 520, 1040, 0.2); tone(t + 0.04, 0.14, 780, 1560, 0.1); },
    // a low hit when the device lands
    hit() { const t = ctx.currentTime; tone(t, 0.45, 120, 42, 0.45); noise(t, 0.25, "lowpass", 900, 120, 0.5, 0.25); },
  };
}
