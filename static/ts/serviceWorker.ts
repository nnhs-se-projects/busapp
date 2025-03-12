

self.addEventListener('push', async (e: any) => {
    const data = e.data.json();

    const tmp: any = self;

    const promiseChain = tmp.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: "/img/busapp-badge.png"
    });
    
    await e.waitUntil(promiseChain);
});

