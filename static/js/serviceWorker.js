"use strict";

self.addEventListener('install', async () => {
    // immediately use the updated serviceworker
    self.skipWaiting();
    // get the offline page
    const cache = await caches.open("offline");
    await cache.add(new Request("/html/offline.html", {cache: 'reload'}));
    await cache.add(new Request("/img/404_background.webp", {cache: 'reload'}));
    await cache.add(new Request("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css", {cache: 'reload'}));
});
  

self.addEventListener('push', async (e) => {
    const data = e.data.json();

    const promiseChain = self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: "/img/busapp-badge.png"
    });
    
    await e.waitUntil(promiseChain);
});


self.addEventListener('activate', async () => {
    // Tell the service worker to take control of the page
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // We only want to call this if this is a request for an HTML page.
    if (event.request.mode === 'navigate') {
      event.respondWith((async () => {
        try {
          return await fetch(event.request);
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          // If fetch() returns a valid HTTP response with a response code in
          // the 4xx or 5xx range, the catch() will NOT be called.
          console.log('Fetch failed; returning offline page instead.', error);
  
          return await (await caches.open("offline")).match("/html/offline.html");
        }
      })());
    }
});

self.addEventListener("notificationclick", (event) => {
    console.log("On notification click: ", event.notification.tag);
    event.notification.close();
  
    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === "/" && "focus" in client) return client.focus();
          }
          if (clients.openWindow) return clients.openWindow("/");
        }),
    );
});  
