let nextWave: any[] = [];
let lots: any[] = [];
let currentWave: any[] = [];

let addNext = (bus) => {
    nextWave.push(bus);
}



async function saveMap() {
    // if (!confirm("AHHHHHHHHHHHHHHHHH")) return;

    await fetch("/updateBusMap", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: 
        JSON.stringify({
            nextWave: nextWave,
            lots: lots,
            currentWave: currentWave
        })
    });

    updateBusMap();
    window.location.assign("/");
}
