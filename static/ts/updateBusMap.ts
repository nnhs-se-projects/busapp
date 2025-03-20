// let nextWave: any[] = [];
// let lots: any[] = [];
// let currentWave: any[] = [];

currentWave.push("129");

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
            // lots: lots,
            // currentWave: currentWave
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
