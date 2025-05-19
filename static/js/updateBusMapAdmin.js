"use strict";

async function save(elem, row) {
    const bus = elem.parentElement.parentElement.querySelector("input").value;
    const row = row;
    const lotNumber = elem.parentElement.parentElement.querySelector("input").id;

    await fetch("/busMapAdmin", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus: bus, row: rowA, lotNumber: lotNumber })
    });

    updateBusMap();
}