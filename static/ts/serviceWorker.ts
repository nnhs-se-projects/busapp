

self.addEventListener('push', async (e: any) => {
    console.log(e.data)
    const data = e.data.json();

    const tmp: any = self;
    const promiseChain = tmp.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        click_action: "/",
        badge: "/img/busapp-badge.png"
    });
    
    await e.waitUntil(promiseChain);
});

