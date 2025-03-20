let busList;
fetch("/busList").then((res) => res.json()).then((data) => busList = data).then(() => console.log(busList));

let newBusEmptyRow;
fetch("/updateBusListEmptyRow").then((res) => res.text()).then((data) => newBusEmptyRow = data);

let newBusRow;
fetch("/updateBusListPopulatedRow").then((res) => res.text()).then((data) => newBusRow = data);

function newBus_busList() {
    const row = (document.getElementsByClassName("buslist-table")[0]).insertRow(1);
    const html = ejs.render(newBusEmptyRow);
    row.innerHTML = html;
    let input = row.children[0].children[0];
    input.focus();
}

function addBus_busList(confirmButton) {
    let row = confirmButton.parentElement.parentElement;
    let number = parseInt((row.children[0].children[0]).value);
    let index = busList.findIndex((currentNumber) => {return number < currentNumber});
    if (index == -1) index = busList.length;
    busList.splice(index, 0, number);
    row.remove();
    const newRow = (document.getElementsByClassName("buslist-table")[0]).insertRow(index + 1);
    const html = ejs.render(newBusRow, {number: number});
    newRow.innerHTML = html;
    newBus_busList();
}

function removeBus_busList(secondChild) {
    let row = secondChild.parentElement.parentElement;
    let number = row.children[0].innerHTML;
    busList.splice(busList.indexOf(parseInt(number)), 1);
    row.remove();
}

async function save() {
    if (!confirm("Are you sure you would like to update the bus list and reset all live pages?")) return;
    
    await fetch("/updateBusList", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: 
        JSON.stringify({
            busList: busList
        })
    });

    updateBusList();
    window.location.assign("/admin");
}

function discardChanges() {
    if (confirm("Are you sure you would like to discard changes?")) location.reload();
}
