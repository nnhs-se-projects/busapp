"use strict";
window.onload = () => { pinnedBusHighlight(); }

// These are the table rows of the respective waves
const currentWave = document.getElementsByClassName("current-wave");
const nextWave = document.getElementsByClassName("next-wave");
const rowA = document.getElementsByClassName("rowA");
const rowB = document.getElementsByClassName("rowB");

const pinString = localStorage.getItem("pins");

let pins = [];
if (pinString != null) {
    let pinArrayString = pinString.split(", ");
    
    for (let i = 0; i < pinArrayString.length; i++) {
        let n = parseInt(pinArrayString[i]);
        pins.push(n);
    }
}


function pinnedBusHighlight() {
    let nextHighlight = [];

    for (let i = 0; i < nextWave.length; i++) {
        const bus = nextWave[i].textContent.trim();

        if (pins.includes(parseInt(bus))) {
            nextWave[i].style.backgroundColor = "#e43939";
            nextWave[i].style.animation = "glowCurrent 1s ease-in-out infinite alternate";

            nextHighlight.push(i);
        }
    }

    for (let i = currentWave.length - 1; i >= 0; i--) {
        const bus = currentWave[i].textContent.trim();

        if (pins.includes(parseInt(bus))) {
            currentWave[i].style.backgroundColor = "#e43939";
            currentWave[i].style.animation = "glowCurrent 1s ease-in-out infinite alternate";
        } if (nextHighlight.includes(i)) {
            currentWave[i].style.borderWidth = "5px";
            currentWave[i].style.borderStyle = "solid";
            currentWave[i].style.borderColor = "#1cbfff";
            currentWave[i].style.animation = "glowNext 1s ease-in-out infinite alternate";
        }
    }

    for (let i = 0; i < rowA.length; i++) {
        const bus = rowA[i].textContent.trim();

        if (pins.includes(parseInt(bus))) {
            rowA[i].style.backgroundColor = "#e43939";
            rowA[i].style.animation = "glowCurrent 1s ease-in-out infinite alternate";
        }
    }
    for (let i = 0; i < rowB.length; i++) {
        const bus = rowB[i].textContent.trim();

        if (pins.includes(parseInt(bus))) {
            rowB[i].style.backgroundColor = "#e43939";
            rowB[i].style.animation = "glowCurrent 1s ease-in-out infinite alternate";
        }
    }
};

function updateBusLots() {
    for (let i = 0; i < rowA.length; i++) {
        rowA[i].textContent = test[i];
    }
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
           lots, lots
       })
   });


   updateBusMap();
   window.location.assign("/admin");
}
