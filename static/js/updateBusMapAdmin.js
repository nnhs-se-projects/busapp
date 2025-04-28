"use strict";
window.onload = () => { updateLots(); }

const rowA = document.getElementsByClassName("rowA");
const rowB = document.getElementsByClassName("rowB");

const test = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];

function updateLots() {
    for (let i = 0; i < rowA.length; i++) {
        rowA[i].textContent = test[i];
    }
    for (let i = 0; i < rowB.length; i++) {
        rowB[i].textContent = test[i + 14];
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