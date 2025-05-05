"use strict";

const rowA = document.getElementsByClassName("rowA");
const rowB = document.getElementsByClassName("rowB");




async function save() {

    for (let i = 0; i < rowA.length; i++) {
        const num = rowA[i].firstChild.textContent.trim();
    }

    await fetch("/updateBusMap", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus: bus })
    });

    updateBusMap();
}