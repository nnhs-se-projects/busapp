"use strict";

async function save(elem, rowX) {
    const bus = elem.parentElement.parentElement.querySelector("input").value.trim().parseInt();
    const row = rowX;
    const lotNumber = elem.parentElement.parentElement.querySelector("input").id.trim().parseInt();

    await fetch("/busMapAdmin", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus: bus, row: row, lotNumber: lotNumber })
    });

    updateBusMap();
}