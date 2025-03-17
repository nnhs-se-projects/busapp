let nextWave: any[] = [];
let lots: any[] = [];
let currentWave: any[] = [];

currentWave = JSON.parse(document.getElementsByClassName("test")[0].getAttribute("data-currentwave")!);

const addNext = (bus) => {
    nextWave.push(bus);
}

const addLots = (bus) => {
    lots.push(bus);
}

const addCurrent = (bus) => {
    currentWave.push(bus);
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
            //nextWave: nextWave,
            // lots: lots,
            currentWave: currentWave
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
