let currentWave = [];

async function saveMap() {
    await fetch("/updateBusMap", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: 
        JSON.stringify({
            currentWave: currentWave,
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
