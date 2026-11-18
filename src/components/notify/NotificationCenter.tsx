"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { playTone, unlockAudio, type Tone } from "@/lib/sounds";
import { readPrefs } from "./prefs";
import { label } from "./labels";

type Item = { id: string; kind: string; title: string; body: string; url: string | null; at: string; read: boolean };

/**
 * Lives in the app layout: keeps the service worker registered, checks for new notifications
 * (every 15 s while visible, at once when a push arrives), shows toasts with Laazizi HQ's sounds,
 * and keeps the unread count on the sidebar and the app icon.
 */
export function NotificationCenter() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Item[]>([]);
  const after = useRef<string | null>(null);
  const seen = useRef(new Set<string>());

  const setUnread = (n: number) => {
    window.dispatchEvent(new CustomEvent("darling:unread", { detail: n }));
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (n > 0) nav.setAppBadge?.(n).catch(() => {}); else nav.clearAppBadge?.().catch(() => {});
  };

  const show = useCallback((items: Item[]) => {
    const fresh = items.filter((i) => !seen.current.has(i.id) && !i.read);
    fresh.forEach((i) => seen.current.add(i.id));
    if (!fresh.length) return;
    const prefs = readPrefs();
    if (prefs.sound && playTone(fresh[0].kind as Tone, prefs.volume)) document.documentElement.dataset.lastTone = fresh[0].kind;
    setToasts((t) => [...fresh.slice(0, 3).reverse(), ...t].slice(0, 4));
    // (while the reel studio films, a toast stays until it's clicked)
    if (!(window as Window & { __reelHold?: boolean }).__reelHold) fresh.forEach((i) => setTimeout(() => setToasts((t) => t.filter((x) => x.id !== i.id)), 7000));
  }, []);

  const check = useCallback(async () => {
    const r = await fetch(`/api/notifications${after.current ? `?after=${encodeURIComponent(after.current)}` : ""}`, { cache: "no-store" }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (!r) return;
    if (after.current) show(r.items); // first load only learns what's already there
    else (r.items as Item[]).forEach((i) => seen.current.add(i.id));
    after.current = r.now;
    setUnread(r.unread);
    if (after.current && r.items.length) window.dispatchEvent(new CustomEvent("darling:new", { detail: r.items }));
  }, [show]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const unlock = () => { unlockAudio(); };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "darling:notification" && !(window as Window & { __reelHold?: boolean }).__reelHold) check(); };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    check();
    let timer: ReturnType<typeof setTimeout>;
    // The reel studio films this page and decides itself when news arrives (it sets __reelHold).
    const held = () => !!(window as Window & { __reelHold?: boolean }).__reelHold;
    const loop = () => { timer = setTimeout(async () => { if (!held()) await check(); loop(); }, document.visibilityState === "visible" ? 15000 : 60000); };
    loop();
    const onVis = () => { if (document.visibilityState === "visible" && !held()) check(); };
    document.addEventListener("visibilitychange", onVis);
    const onRead = () => check();
    window.addEventListener("darling:read", onRead);
    return () => {
      clearTimeout(timer);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("darling:read", onRead);
    };
  }, [check]);

  const open = async (i: Item) => {
    setToasts((t) => t.filter((x) => x.id !== i.id));
    await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: [i.id] }) }).catch(() => {});
    check();
    router.push(i.url || "/app/notifications");
  };

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-end gap-2 print:hidden sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[360px]">
      {toasts.map((t) => (
        <div key={t.id} className="toast-in pointer-events-auto w-full border border-ink bg-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <button onClick={() => open(t)} className="block w-full px-4 py-3 text-left">
            <span className="label-caps flex items-center gap-2 text-muted"><span className={`h-2 w-2 rounded-full ${t.kind === "payment" || t.kind === "deposit" ? "bg-[#4f9cf0]" : t.kind === "cancelled" || t.kind === "alert" ? "bg-ink" : "bg-pink"}`} />{label(t.kind)}</span>
            <span className="mt-1 block text-[16px] leading-snug">{t.title}</span>
            <span className="mt-0.5 block text-[13px] text-muted">{t.body}</span>
          </button>
          <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="label-caps w-full border-t border-ink/15 px-4 py-1.5 text-right text-muted hover:text-ink">Dismiss</button>
        </div>
      ))}
    </div>
  );
}

