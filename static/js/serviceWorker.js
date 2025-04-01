"use strict";
self.addEventListener('push', async (e) => {
    const data = e.data.json();

    const promiseChain = self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: "/img/busapp-badge.png"
    });
    
    await e.waitUntil(promiseChain);
});

