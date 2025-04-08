/*
This is a very scuffed way to do this but basically changeMap() will toggle between the bus lots and the usual waves.
Stores the html of each one and swaps them out when the button is pressed.
*/
const nextContent = document.getElementById("next-wave").innerHTML;
const currentContent = document.getElementById("current-wave").innerHTML;
const lotsContent = document.getElementById("bus-lots").innerHTML;

document.getElementById("bus-lots").innerHTML = "";

function changeMap() {
    if (document.getElementById("next-wave").innerHTML !== "") {

        document.getElementById("next-wave").innerHTML = "";
        document.getElementById("current-wave").innerHTML = "";

        document.getElementById("bus-lots").innerHTML = lotsContent;
    }
    else {
        document.getElementById("next-wave").innerHTML = nextContent;
        document.getElementById("current-wave").innerHTML = currentContent;

        document.getElementById("bus-lots").innerHTML = "";
    }
}

function getStuff() {
    const current = document.getElementsByClassName("current");
    
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
            currentWave: currentWave
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
