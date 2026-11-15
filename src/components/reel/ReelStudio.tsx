"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildReel, type ReelConfig } from "./scenes";
import { scheduleScore } from "./score";

const FORMATS = {
  portrait: { label: "9:16 · 1080×1920 (TikTok, Reels, Shorts)", w: 1080, h: 1920 },
  square: { label: "1:1 · 1080×1080 (feed)", w: 1080, h: 1080 },
  landscape: { label: "16:9 · 1920×1080 (YouTube)", w: 1920, h: 1080 },
} as const;
type Format = keyof typeof FORMATS;

function pickMime() {
  // H.264 MP4 first (what TikTok/Instagram/YouTube prefer); otherwise WebM, labelled honestly.
  const avc = ["avc1.640028", "avc1.4D0028", "avc1.42E028", "avc1.42E01E"];
  const types = [...avc.flatMap((v) => [`video/mp4;codecs=${v},mp4a.40.2`, `video/mp4;codecs=${v},opus`]), "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

export function ReelStudio({ base }: { base: ReelConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef(false);
  const [format, setFormat] = useState<Format>("portrait");
  const [fps, setFps] = useState(60);
  const [music, setMusic] = useState<"score" | "upload" | "none">("score");
  const [upload, setUpload] = useState<{ name: string; data: ArrayBuffer } | null>(null);
  const [showOffer, setShowOffer] = useState(base.offer.enabled);
  const [domain, setDomain] = useState(base.domain);
  const [status, setStatus] = useState<"idle" | "preview" | "recording" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number; mime: string } | null>(null);
  const [error, setError] = useState("");

  const cfg: ReelConfig = useMemo(() => ({ ...base, domain, offer: { ...base.offer, enabled: showOffer && base.offer.slots > 0 } }), [base, domain, showOffer]);
  const reel = useMemo(() => buildReel(cfg), [cfg]);
  const { w: W, h: H } = FORMATS[format];

  // still frame for the idle state: the biggest SAY NO MORE slam
  useEffect(() => {
    const c = canvasRef.current?.getContext("2d");
    if (!c || status === "preview" || status === "recording") return;
    document.fonts.load('700 100px "Geist Variable"').finally(() => reel.render(c, 2.7, W, H));
  }, [reel, W, H, status]);

  async function run(record: boolean) {
    setError(""); setResult(null); stopRef.current = false;
    const canvas = canvasRef.current!;
    const c = canvas.getContext("2d")!;
    await Promise.all([document.fonts.load('700 100px "Geist Variable"'), document.fonts.load('500 100px "Geist Variable"'), document.fonts.ready]);
    const actx = new AudioContext({ sampleRate: 48000 });
    await actx.resume();
    const dest = actx.createMediaStreamDestination();
    const out = actx.createGain();
    out.connect(actx.destination); out.connect(dest);
    const t0 = actx.currentTime + 0.3;
    if (music === "score") scheduleScore(actx, out, t0, reel.hits, reel.length, reel.finalAt);
    if (music === "upload" && upload) {
      try {
        const buf = await actx.decodeAudioData(upload.data.slice(0));
        const src = actx.createBufferSource(); src.buffer = buf;
        const g = actx.createGain();
        g.gain.setValueAtTime(1, t0 + reel.length - 1.2); g.gain.linearRampToValueAtTime(0.0001, t0 + reel.length + 0.4);
        src.connect(g).connect(out); src.start(t0); src.stop(t0 + reel.length + 0.5);
      } catch { setError("Couldn't read that audio file. Try an MP3 or WAV."); }
    }

    let rec: MediaRecorder | null = null;
    const chunks: Blob[] = [];
    const mime = pickMime();
    if (record) {
      if (!mime) { setError("This browser can't record video. Use Chrome or Edge on a computer."); actx.close(); return; }
      const stream = new MediaStream([...canvas.captureStream(fps).getVideoTracks(), ...dest.stream.getAudioTracks()]);
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: format === "landscape" ? 16_000_000 : 14_000_000, audioBitsPerSecond: 192_000 });
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start(250);
    }
    setStatus(record ? "recording" : "preview");

    await new Promise<void>((resolve) => {
      const frame = () => {
        const t = actx.currentTime - t0;
        reel.render(c, Math.max(0, t), W, H);
        setProgress(Math.min(1, Math.max(0, t / reel.length)));
        if (t < reel.length + 0.35 && !stopRef.current) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    if (rec) {
      const stopped = new Promise<void>((r) => (rec!.onstop = () => r()));
      rec.stop(); await stopped;
      if (!stopRef.current) {
        const type = mime.split(";")[0];
        const blob = new Blob(chunks, { type });
        const ext = type.includes("mp4") ? "mp4" : "webm";
        const name = `${base.name.toLowerCase()}-reel-${format}-${new Date().toISOString().slice(0, 10)}.${ext}`;
        const url = URL.createObjectURL(blob);
        setResult({ url, name, size: blob.size, mime: mime });
        const a = document.createElement("a"); a.href = url; a.download = name; a.click();
      }
    }
    await actx.close();
    setStatus(stopRef.current ? "idle" : record ? "done" : "idle");
  }

  const busy = status === "preview" || status === "recording";
  const scale = format === "landscape" ? 0.36 : format === "square" ? 0.42 : 0.26;

  return (
    <div className="grid gap-12 lg:grid-cols-[auto_1fr]">
      <div>
        <canvas ref={canvasRef} width={W} height={H} className="border border-ink bg-ink" style={{ width: W * scale, height: H * scale, maxWidth: "100%" }} aria-label="Reel preview" />
        <div className="mt-3 h-px bg-ink/20" style={{ width: W * scale, maxWidth: "100%" }}><div className="h-px bg-ink" style={{ width: `${progress * 100}%` }} /></div>
        <p className="label-caps mt-2 text-muted">{(progress * reel.length).toFixed(1)}s / {reel.length.toFixed(1)}s</p>
      </div>

      <div className="max-w-xl space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as Format)} disabled={busy} className="input">
              {Object.entries(FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Frame rate</label>
            <select value={fps} onChange={(e) => setFps(Number(e.target.value))} disabled={busy} className="input">
              <option value={60}>60 fps (smoothest)</option><option value={30}>30 fps (smaller file)</option>
            </select>
          </div>
          <div>
            <label className="label">Music</label>
            <select value={music} onChange={(e) => setMusic(e.target.value as typeof music)} disabled={busy} className="input">
              <option value="score">Opera-style score (built in)</option><option value="upload">My own track</option><option value="none">No music</option>
            </select>
          </div>
          {music === "upload" && (
            <div className="sm:col-span-2">
              <label className="label">Audio file (MP3, WAV, M4A)</label>
              <input type="file" accept="audio/*" disabled={busy} className="text-[14px]" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setUpload({ name: f.name, data: await f.arrayBuffer() }); }} />
              <p className="mt-2 text-[13px] text-muted">Only use music you have the rights to. On TikTok business accounts, use a Commercial Music Library sound.</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Website shown at the end</label>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} disabled={busy} className="input" />
          </div>
          <label className="flex items-center gap-2 text-[14px] sm:col-span-2">
            <input type="checkbox" checked={showOffer} onChange={(e) => setShowOffer(e.target.checked)} disabled={busy || base.offer.slots === 0} />
            Include the founding offer ({base.offer.percent}% off for {base.offer.months} months, {base.offer.left} of {base.offer.slots} places left)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => run(false)} disabled={busy} className="btn-secondary">Preview with sound</button>
          <button onClick={() => run(true)} disabled={busy || (music === "upload" && !upload)} className="btn-primary">Record &amp; download</button>
          {busy && <button onClick={() => (stopRef.current = true)} className="btn-ghost">Stop</button>}
        </div>
        {status === "recording" && <p className="border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">Recording in real time. Keep this tab open and visible until it finishes ({reel.length.toFixed(0)} seconds).</p>}
        {error && <p className="border-l-2 border-pink bg-panel px-4 py-3 text-[14px] text-pink">{error}</p>}
        {result && (
          <div className="border-t-2 border-ink pt-4 text-[14px]">
            <p>Saved <b className="font-medium">{result.name}</b> · {(result.size / 1_000_000).toFixed(1)} MB · {result.mime}</p>
            <a href={result.url} download={result.name} className="btn-secondary btn-sm mt-3">Download again</a>
            {!result.mime.includes("avc1") && (
              <div className="mt-3 text-[13px] text-muted">
                <p>This browser can&apos;t record H.264, so it saved WebM. TikTok accepts WebM on upload; for Instagram, record in desktop Chrome (which saves H.264 MP4) or convert it with ffmpeg:</p>
                <code className="mt-2 block break-all bg-panel px-3 py-2 text-ink">ffmpeg -i {result.name} -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k {result.name.replace(/\.\w+$/, "")}-h264.mp4</code>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="label-caps mb-3">Sequence</p>
          <ol className="border-t border-ink text-[14px]">
            {reel.scenes.map((s, i) => (
              <li key={s.id} className="flex justify-between border-b border-ink/20 py-2">
                <span><sup className="mr-2 text-[10px]">{i + 1}</sup>{SCENE_NAMES[s.id] ?? s.id}</span>
                <span className="tabular-nums text-muted">{s.start.toFixed(1)}s</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

const SCENE_NAMES: Record<string, string> = {
  "say-no-more": "SAY NO MORE (big, bigger, biggest)",
  positioning: "Not a website. A booking engine.",
  booking: "Online booking",
  mpesa: "M-Pesa checkout",
  reminders: "Reminders",
  deposits: "Deposits",
  clients: "Client records",
  reports: "Reports & staff earnings",
  offer: "Founding offer",
  price: "Pricing",
  cta: "Logo + free trial",
};
