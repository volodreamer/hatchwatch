/* Hatchwatch care-call worker. No fetch handler — never caches the app. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "care") return;
  const icon = new URL("icon-192-v2.png", self.registration.scope).href;
  event.waitUntil(
    self.registration.showNotification(data.title || "Hatchwatch", {
      body: data.body || "A care window is open.",
      tag: "hatchwatch-care",
      silent: false,
      icon,
      badge: icon,
      requireInteraction: true,
      vibrate: [180, 80, 180, 80, 240],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(self.registration.scope);
    }),
  );
});
