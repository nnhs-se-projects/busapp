"use strict";
window.onload = () => { document.getElementById("addInput").value = ""; }

const rowA = document.getElementsByClassName("rowA");
const rowB = document.getElementsByClassName("rowB");

const test = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];

async function save(elem) {

    const bus = elem.parentElement.parentElement.querySelector("input").value;
    await fetch("/updateBusMapAdmin", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus: bus })
    });

    updateBusList();
}