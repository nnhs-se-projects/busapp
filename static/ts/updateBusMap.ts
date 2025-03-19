let nextWave: any[] = [];
let lots: any[] = [];
let currentWave: any[] = [];

const next = document.getElementById("next-wave")!;
const g = next.getElementsByTagName("input");
for (let i = 0; i < g.length; i++) {
    nextWave.push(g[i].getAttribute("value"));
}

async function saveMap() {
    await fetch("/updateBusMap", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: 
        JSON.stringify({
            nextWave: nextWave,
            // lots: lots,
            // currentWave: currentWave
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
