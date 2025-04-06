let currentWave = [];

function changeMap() {
    let value = document.getElementByID("next-wave").rows[0].cells[0].innerHTML;
    value.remove();
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
            currentWave: currentWave,
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
