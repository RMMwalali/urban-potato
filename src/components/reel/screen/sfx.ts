// Sound design for the demos, from real recordings in /public/reel-sfx (see LICENSES.md there):
// typewriter or keyboard keys, mouse clicks, phone taps, whooshes, a notification chime and a till.
// Each play varies pitch and level slightly so repeated sounds feel natural. If a file is missing,
// a synthesised stand-in plays instead so a demo never goes silent.

export type TypingStyle = "typewriter" | "keyboard";
export type Sfx = {
  key(ch: string, on: "desktop" | "phone"): void;
  enter(on: "desktop" | "phone"): void;
  click(on: "desktop" | "phone"): void;
  whoosh(strength?: number): void;
  pop(): void;
  hit(): void;
  notify(kind?: "booking" | "payment"): void;
};
export const silentSfx: Sfx = { key() {}, enter() {}, click() {}, whoosh() {}, pop() {}, hit() {}, notify() {} };

const FILES = [
  "key-1", "key-2", "key-3", "key-4", "key-5", "key-6", "key-7", "key-8", "key-space", "key-enter",
  "typewriter-1", "typewriter-2", "typewriter-3", "typewriter-4", "typewriter-bell",
  "click-1", "click-2", "trackpad", "tap-1", "tap-2", "whoosh-1", "whoosh-2", "whoosh-3", "notify", "cash",
];

export async function makeSfx(ctx: AudioContext, out: AudioNode, style: TypingStyle): Promise<Sfx> {
  const bus = ctx.createGain();
  bus.gain.value = 0.9;
  bus.connect(out);
  const buf = new Map<string, AudioBuffer>();
  await Promise.all(FILES.map(async (f) => {
    try {
      const r = await fetch(`/reel-sfx/${f}.mp3`);
      if (r.ok) buf.set(f, await ctx.decodeAudioData(await r.arrayBuffer()));
    } catch {}
  }));
  const pick = (prefix: string) => { const xs = [...buf.keys()].filter((k) => k.startsWith(prefix) && /\d$/.test(k)); return xs[Math.floor(Math.random() * xs.length)]; };
  const play = (name: string | undefined, gain = 1, rateJitter = 0.04) => {
    const b = name ? buf.get(name) : undefined;
    if (!b) return false;
    const s = ctx.createBufferSource(); s.buffer = b;
    s.playbackRate.value = 1 + (Math.random() * 2 - 1) * rateJitter;
    const g = ctx.createGain(); g.gain.value = gain * (0.85 + Math.random() * 0.25);
    s.connect(g).connect(bus); s.start();
    return true;
  };

  // synthesised stand-ins, only used when a recording is missing
  const noise = (dur: number, f0: number, f1: number, peak: number, type: BiquadFilterType = "bandpass") => {
    const len = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(peak, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    s.connect(f).connect(g).connect(bus); s.start();
  };

  return {
    key(ch, on) {
      if (on === "phone") { play(pick("tap"), 0.45) || noise(0.02, 2500, 1800, 0.1); return; }
      if (style === "typewriter") play(pick("typewriter"), ch === " " ? 0.6 : 0.85) || noise(0.04, 1800, 900, 0.3);
      else play(ch === " " && buf.has("key-space") ? "key-space" : pick("key"), 0.8) || noise(0.03, 2600, 1500, 0.18);
    },
    enter(on) {
      if (on === "phone") return;
      if (style === "typewriter") play("typewriter-bell", 0.55, 0.01);
      else play("key-enter", 0.8);
    },
    click(on) {
      if (on === "phone") play(pick("tap"), 0.7) || noise(0.025, 3000, 2000, 0.15);
      else play(pick("click"), 0.85) || noise(0.03, 4000, 2500, 0.3, "highpass");
    },
    whoosh(strength = 0.6) { play(pick("whoosh"), 0.35 + strength * 0.4, 0.06) || noise(0.5, 400, 2600, 0.15); },
    pop() { play("trackpad", 0.5) || noise(0.05, 1200, 2400, 0.1); },
    hit() { play("whoosh-3", 0.5, 0.02); },
    notify(kind) { play(kind === "payment" && buf.has("cash") ? "cash" : "notify", 0.85, 0.005) || noise(0.3, 1500, 3000, 0.2); },
  };
}
