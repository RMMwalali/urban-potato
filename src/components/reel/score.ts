// Original opera-style dramatic score, synthesised live with the Web Audio API.
// Orchestral stabs, timpani, cymbals, a choir pad, driving strings and a soprano line built on the
// Gregorian "Dies irae" chant (13th century, public domain). Nothing here is a copyrighted recording.

export type Hit = { t: number; big?: boolean };

const NOTE: Record<string, number> = { C: 0, "C#": 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const hz = (n: string) => {
  const m = n.match(/^([A-G](?:#|b)?)(-?\d)$/)!;
  return 440 * Math.pow(2, (NOTE[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12);
};

function impulse(ctx: BaseAudioContext, seconds = 2.6, decay = 2.8) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function noiseBuffer(ctx: BaseAudioContext, seconds = 2) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Schedule the whole score starting at `t0` (AudioContext time).
 * `hits` are the timeline moments (seconds from t0) that get an orchestral stab; `length` is the reel length.
 * Returns the master output node, already connected to `out`.
 */
export function scheduleScore(ctx: AudioContext, out: AudioNode, t0: number, hits: Hit[], length: number, finalAt = length - 4.6) {
  const master = ctx.createGain();
  master.gain.value = 0.7;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
  const reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx);
  const wet = ctx.createGain(); wet.gain.value = 0.32;
  const dry = ctx.createGain(); dry.gain.value = 0.85;
  const bus = ctx.createGain();
  bus.connect(dry).connect(comp);
  bus.connect(reverb).connect(wet).connect(comp);
  comp.connect(master).connect(out);
  // fade out at the end
  master.gain.setValueAtTime(0.7, t0 + length - 1.2);
  master.gain.linearRampToValueAtTime(0.0001, t0 + length + 0.6);

  const noise = noiseBuffer(ctx);

  const voice = (freq: number, start: number, dur: number, opts: { type?: OscillatorType; gain?: number; attack?: number; release?: number; cutoff?: number; detune?: number; vibrato?: number; dest?: AudioNode }) => {
    const o = ctx.createOscillator();
    o.type = opts.type ?? "sawtooth";
    o.frequency.value = freq;
    if (opts.detune) o.detune.value = opts.detune;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = opts.cutoff ?? 2400; f.Q.value = 0.7;
    const g = ctx.createGain();
    const peak = opts.gain ?? 0.08, a = opts.attack ?? 0.01, r = opts.release ?? 0.3;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + a);
    g.gain.setValueAtTime(peak, start + Math.max(a, dur - r));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur + r);
    if (opts.vibrato) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.6;
      const lg = ctx.createGain(); lg.gain.value = freq * opts.vibrato;
      lfo.connect(lg).connect(o.frequency); lfo.start(start); lfo.stop(start + dur + r + 0.1);
    }
    o.connect(f).connect(g).connect(opts.dest ?? bus);
    o.start(start); o.stop(start + dur + r + 0.1);
  };

  // Choir "aah": sawtooth through vowel formant band-passes
  const choir = (notes: string[], start: number, dur: number, gain = 0.05) => {
    const formants = [[800, 1], [1150, 0.5], [2900, 0.25]] as const;
    const mix = ctx.createGain(); mix.connect(bus);
    for (const [fr, lv] of formants) {
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fr; bp.Q.value = 6;
      const lg = ctx.createGain(); lg.gain.value = lv * 3;
      bp.connect(lg).connect(mix);
      for (const n of notes) for (const det of [-9, 0, 8]) voice(hz(n), start, dur, { gain, attack: 0.35, release: 0.8, cutoff: 6000, detune: det, vibrato: 0.004, dest: bp });
    }
  };

  const timpani = (start: number, gain = 0.9, pitch = 98) => {
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(pitch * 1.6, start);
    o.frequency.exponentialRampToValueAtTime(pitch, start + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start); g.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
    o.connect(g).connect(bus); o.start(start); o.stop(start + 1.5);
    const n = ctx.createBufferSource(); n.buffer = noise;
    const nf = ctx.createBiquadFilter(); nf.type = "lowpass"; nf.frequency.value = 900;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(gain * 0.5, start); ng.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    n.connect(nf).connect(ng).connect(bus); n.start(start); n.stop(start + 0.3);
  };

  const cymbal = (start: number, gain = 0.25) => {
    const n = ctx.createBufferSource(); n.buffer = noise;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, start); g.gain.exponentialRampToValueAtTime(0.0001, start + 1.8);
    n.connect(hp).connect(g).connect(bus); n.start(start); n.stop(start + 1.9);
  };

  // Full-orchestra stab: low brass + choir + timpani + cymbal
  const stab = (start: number, big = false) => {
    for (const n of ["G1", "G2", "D3", "G3", "Bb3", "D4"]) voice(hz(n), start, big ? 0.9 : 0.45, { gain: big ? 0.075 : 0.055, attack: 0.008, release: big ? 0.9 : 0.5, cutoff: big ? 3200 : 2200 });
    choir(["G3", "Bb3", "D4", "G4"], start, big ? 1.1 : 0.55, big ? 0.05 : 0.035);
    timpani(start, big ? 1 : 0.7);
    cymbal(start, big ? 0.3 : 0.15);
  };

  for (const h of hits) stab(t0 + h.t, h.big);

  // Driving section from the first scene after the intro
  const startDrive = (hits[3]?.t ?? 3.6);
  const beat = 0.5; // 120 bpm
  // chord progression Gm – Eb – Cm – D, 2 bars (4 s) each
  const prog: { root: string; chord: string[] }[] = [
    { root: "G", chord: ["G3", "Bb3", "D4"] },
    { root: "Eb", chord: ["Eb3", "G3", "Bb3"] },
    { root: "C", chord: ["C3", "Eb3", "G3"] },
    { root: "D", chord: ["D3", "F#3", "A3"] },
  ];
  const endDrive = finalAt - 0.1;
  for (let t = startDrive, i = 0; t < endDrive; t += 4, i++) {
    const c = prog[i % prog.length];
    choir(c.chord, t0 + t, 3.9, 0.03);
    // string ostinato: eighth notes on root/fifth, octave bounce
    const root = hz(`${c.root}2`);
    for (let k = 0; k < 16 && t + k * beat * 0.5 < endDrive; k++) {
      const f = k % 4 === 3 ? root * 2 : k % 2 ? root * 1.5 : root;
      voice(f, t0 + t + k * beat * 0.5, 0.2, { gain: 0.06, attack: 0.005, release: 0.08, cutoff: 1500 });
    }
    timpani(t0 + t, 0.55, c.root === "D" ? 110 : c.root === "Eb" ? 78 : c.root === "C" ? 65 : 98);
    timpani(t0 + t + 2, 0.4, c.root === "D" ? 110 : 98);
  }

  // Soprano: Dies irae chant (public domain), transposed to G minor, two phrases
  const dies = ["Bb4", "A4", "Bb4", "G4", "A4", "F4", "G4", "G4", "Bb4", "C5", "Bb4", "A4", "G4", "F4", "G4", "G4"];
  const durs = [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2];
  let st = startDrive + 4; // enter after one cycle
  for (let rep = 0; rep < 3 && st < endDrive - 2; rep++) {
    for (let i = 0; i < dies.length && st < endDrive; i++) {
      const d = durs[i] * beat;
      voice(hz(dies[i]), t0 + st, d * 0.95, { type: "triangle", gain: 0.07, attack: 0.06, release: 0.25, cutoff: 5000, vibrato: 0.012 });
      voice(hz(dies[i]) * 2, t0 + st, d * 0.95, { type: "sine", gain: 0.012, attack: 0.06, release: 0.25, cutoff: 8000, vibrato: 0.012 });
      st += d;
    }
  }

  // Final chord: everything, long tail
  const fin = finalAt;
  stab(t0 + fin, true);
  choir(["G2", "D3", "G3", "Bb3", "D4", "G4"], t0 + fin, 3.6, 0.045);
  voice(hz("G4"), t0 + fin + 0.3, 3, { type: "triangle", gain: 0.06, attack: 0.2, release: 1, cutoff: 5000, vibrato: 0.014 });
  return master;
}
