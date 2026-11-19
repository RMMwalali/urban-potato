"use client";
import { useEffect, useState } from "react";
import { playTone, TONE_LABEL, unlockAudio, type Tone } from "@/lib/sounds";
import { readPrefs, writePrefs, type SoundPrefs } from "./prefs";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const raw = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(raw, (c) => c.charCodeAt(0)); };

export function NotifySettings() {
  const [prefs, setPrefs] = useState<SoundPrefs>({ sound: true, volume: 0.8 });
  const [env, setEnv] = useState({ supported: false, ios: false, standalone: false, permission: "default" as NotificationPermission | "unsupported" });
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [install, setInstall] = useState<BIPEvent | null>(null);

  useEffect(() => {
    setPrefs(readPrefs());
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setEnv({ supported, ios, standalone, permission: "Notification" in window ? Notification.permission : "unsupported" });
    if (supported) navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => setSubscribed(!!s)).catch(() => {});
    const onBip = (e: Event) => { e.preventDefault(); setInstall(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const save = (p: SoundPrefs) => { setPrefs(p); writePrefs(p); };

  async function enable() {
    setBusy(true); setMsg("");
    try {
      await unlockAudio();
      const perm = await Notification.requestPermission();
      setEnv((e) => ({ ...e, permission: perm }));
      if (perm !== "granted") { setMsg(perm === "denied" ? "Notifications are blocked for this site. Allow them in your browser's site settings, then try again." : "Notifications weren't allowed."); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const { publicKey } = await fetch("/api/push/key").then((r) => r.json());
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(publicKey) }));
      const r = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...sub.toJSON(), standalone: env.standalone }) });
      if (!r.ok) throw new Error("Couldn't save this device.");
      setSubscribed(true);
      setMsg(`On. This ${env.standalone ? "app" : "browser"} will get notifications even when ${env.standalone ? "it's" : "Darling HQ is"} closed.`);
    } catch (e) {
      setMsg((e as Error).message || "Couldn't turn on notifications.");
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    const sub = await navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).catch(() => null);
    if (sub) { await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setSubscribed(false); setBusy(false); setMsg("Off on this device.");
  }

  async function test() {
    await unlockAudio();
    setMsg("Sending…");
    const r = await fetch("/api/push/test", { method: "POST" });
    setMsg(r.ok ? "Sent. You should hear it and see it in a moment." : "Couldn't send a test.");
    window.dispatchEvent(new Event("darling:read"));
  }

  const iosNeedsInstall = env.ios && !env.standalone;
  return (
    <div className="space-y-10">
      <section className="border-t-2 border-ink pt-5">
        <p className="label-caps">This device</p>
        {iosNeedsInstall ? (
          <div className="mt-4 space-y-2 text-[15px]">
            <p>On iPhone and iPad, notifications work once Darling HQ is on your Home Screen:</p>
            <ol className="list-decimal space-y-1 pl-5 text-[14px] text-muted">
              <li>Tap the Share button in Safari.</li>
              <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
              <li>Open Darling HQ from your Home Screen and come back to this page to turn notifications on.</li>
            </ol>
            <p className="text-[13px] text-muted">While Darling HQ is open you&apos;ll still see and hear every notification here.</p>
          </div>
        ) : !env.supported ? (
          <p className="mt-4 text-[14px] text-muted">This browser can&apos;t receive notifications when Darling HQ is closed. You&apos;ll still see and hear them while it&apos;s open.</p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {subscribed ? (
              <>
                <span className="text-[15px]">Notifications are on for this {env.standalone ? "app" : "browser"}.</span>
                <button onClick={disable} disabled={busy} className="btn-secondary btn-sm">Turn off</button>
              </>
            ) : (
              <button onClick={enable} disabled={busy} className="btn-primary">{busy ? "Turning on…" : "Turn on notifications"}</button>
            )}
            <button onClick={test} className="btn-secondary btn-sm">Send a test</button>
          </div>
        )}
        {install && !env.standalone && (
          <button onClick={async () => { await install.prompt(); setInstall(null); }} className="btn-secondary btn-sm mt-4">Install the Darling HQ app</button>
        )}
        {msg && <p className="mt-3 border-l-2 border-ink bg-panel px-3 py-2 text-[14px]">{msg}</p>}
      </section>

      <section className="border-t-2 border-ink pt-5">
        <p className="label-caps">Sounds on this device</p>
        <label className="mt-4 flex items-center gap-3 text-[15px]"><input type="checkbox" checked={prefs.sound} onChange={(e) => save({ ...prefs, sound: e.target.checked })} /> Play a sound when something happens</label>
        <label className="mt-4 flex max-w-sm items-center gap-3 text-[14px]">
          <span className="label-caps w-16 text-muted">Volume</span>
          <input type="range" min={0.1} max={1} step={0.05} value={prefs.volume} onChange={(e) => save({ ...prefs, volume: Number(e.target.value) })} className="flex-1 accent-[#d9468a]" disabled={!prefs.sound} />
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          {(["booking", "payment", "rescheduled", "cancelled", "alert"] as Tone[]).map((t) => (
            <button key={t} type="button" onClick={async () => { await unlockAudio(); playTone(t, prefs.volume); }} className="btn btn-sm border-ink/30">Play: {TONE_LABEL[t]}</button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-muted">These sounds play while Darling HQ is open. When it&apos;s closed, your phone or computer uses its own notification sound.</p>
      </section>
    </div>
  );
}
