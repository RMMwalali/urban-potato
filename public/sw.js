// Darling service worker: push notifications for the web app and the installed app (PWA).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: "Darling", body: event.data ? event.data.text() : "" }; }
  const title = d.title || "Darling";
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const focused = wins.some((w) => w.focused && w.visibilityState === "visible");
    // tell open windows straight away: they show the toast and play Darling's own sound
    wins.forEach((w) => w.postMessage({ type: "darling:notification", payload: d }));
    if (typeof d.badge === "number" && self.navigator.setAppBadge) self.navigator.setAppBadge(d.badge).catch(() => {});
    // the system banner is always shown (iOS requires it); silent when Darling is already in front,
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
