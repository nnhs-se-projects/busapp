//let nextWave = [];
//let lots = [];
//let currentWave = [];

//const next = document.getElementById("next-wave");
//const g = next.getElementsByTagName("input");
//for (let i = 0; i < g.length; i++) {
//    nextWave.push(g[i].getAttribute("value"));
//}

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
