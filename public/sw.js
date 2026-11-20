// Darling HQ service worker: push notifications for the web app and the installed app (PWA), and a
// friendly "you're offline" screen instead of the browser's error page. Pages are never cached: bookings
// and payments must always be live.
const OFFLINE = "/offline.html";
const CACHE = "darlinghq-offline-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(new Request(OFFLINE, { cache: "reload" }))).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(OFFLINE)) || Response.error()));
});

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: "Darling HQ", body: event.data ? event.data.text() : "" }; }
  const title = d.title || "Darling HQ";
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const focused = wins.some((w) => w.focused && w.visibilityState === "visible");
    // tell open windows straight away: they show the toast and play Darling HQ's own sound
    wins.forEach((w) => w.postMessage({ type: "darling:notification", payload: d }));
    if (typeof d.badge === "number" && self.navigator.setAppBadge) self.navigator.setAppBadge(d.badge).catch(() => {});
    // the system banner is always shown (iOS requires it); silent when Darling HQ is already in front,
    // because the app plays the custom sound itself
    await self.registration.showNotification(title, {
      body: d.body || "",
      tag: d.tag || d.id || undefined,
      data: { url: d.url || "/app/notifications", id: d.id },
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      silent: focused,
      renotify: false,
      timestamp: Date.now(),
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/app/notifications", self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const same = wins.find((w) => new URL(w.url).origin === self.location.origin);
    if (same) { await same.focus(); if ("navigate" in same) return same.navigate(url); return; }
    return self.clients.openWindow(url);
  })());
});
