"use strict";

const rowAContent = document.getElementsByClassName("rowA");
const rowBContent = document.getElementsByClassName("rowB");

let rowA = [];
let rowB = [];


async function save() {

    for (let i = 0; i < rowAContent.length; i++) {
        const numA = rowAContent[i].children[0].value;
        const numB = rowBContent[i].children[0].value;

        rowA[i] = numA;
        rowB[i] = numB;
    }

    await fetch("/busMapAdmin", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowA: rowA, rowB: rowB })
    });

    updateBusMap();
}