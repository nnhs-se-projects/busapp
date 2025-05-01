"use strict";
// window.onload = () => { setLots(); }

const rowA = document.getElementsByClassName("rowA");
const rowB = document.getElementsByClassName("rowB");

let rowAList = [];
let rowBList = [];
rowAList.length = 14;
rowBList.length = 14;



function setLots() {
    for (let i = 0; i < rowA.length; i++) {
        const busA = rowAList[i];
        const busB = rowBList[i];
        if (isNaN(busA)) {
            rowA[i].textContent = busA;
        }
        if (isNaN(busB)) {
            rowB[i].textContent = busB;
        }
    }
}


async function save(elem) {

    const bus = elem.parentElement.parentElement.querySelector("input").value;

    await fetch("/updateBusMap", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus: bus })
    });

    updateBusMap();
}