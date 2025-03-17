"use strict";
/// <reference path="./socket-io-client.d.ts"/>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var pinButtons = document.getElementsByClassName("pin-button");
var indexSocket = window.io('/'); // This line and the line above is how you get ts types to work on clientside... cursed
// !!! do NOT import/export anything or ejs will get angry
var countDownDate = new Date();
var pins = [];
var notifStatus = {};
updatePins();
updateTables();
var panelExpanded = false;
// end of initializing stuff
indexSocket.on("update", (data) => {
    // console.log("update received")
    // convert from time strings to dates to allow conversion to local time
    data.buses.forEach((bus) => {
        if (bus.time != "")
            bus.time = new Date(bus.time);
    });
    countDownDate = new Date(data.leavingAt);
    const html = ejs.render(document.getElementById("getRender").getAttribute("render"), { data: data });
    document.getElementById("content").innerHTML = html;
    updatePins();
    setIndicatorStatus(lastStatus);
});
function hideWhatsNew(version) {
    document.getElementById('whatsNewPopup').style.display = 'none';
    localStorage.setItem("whatsNewVersion", String(version));
}
window.onload = () => {
    var version = +document.getElementById("whatsNewVersion").value;
    if (!localStorage.getItem("whatsNewVersion") || +localStorage.getItem("whatsNewVersion") < version) {
        document.getElementById('whatsNewPopup').style.display = 'block';
    }
};
function updateTables() {
    // updatePins();
    // let tablePins = <HTMLTableElement> document.getElementById("pin-bus-table");
    // let pinRows = tablePins.rows;
    // let lastHide = false; // determines if the last row ("no buses pinned") should be hidden or not
    // for (let i = 2; i < pinRows.length - 1; i++) { // hides rows that aren't in the pins
    //     let number = parseInt(pinRows[i]!.firstElementChild!.innerHTML);
    //     if (pins.includes(number)) {
    //         pinRows[i].hidden = false;
    //         lastHide = true;
    //     } else {
    //         pinRows[i].hidden = true;
    //     }
    // }
    // pinRows[pinRows.length - 1].hidden = lastHide;
    // let tableFull = <HTMLTableElement> document.getElementById("all-bus-table");
    // let fullRows = tableFull.rows;
    // for (let i = 2; i < fullRows.length; i++) { // first two rows are the table header and the column headers
    //     let number = parseInt(fullRows[i]!.firstElementChild!.innerHTML)
    //     let button = <HTMLElement> fullRows[i].lastElementChild!.firstElementChild
    //     if (pins.includes(number)){ // lol, lmao even
    //         button!.innerHTML = "<i class='fa-solid fa-thumbtack'></i> Unpin"
    //         button!.style.backgroundColor = "#ab0808";
    //     } else {
    //         button!.innerHTML = "<i class='fa-solid fa-thumbtack'></i> Pin"
    //         button!.style.backgroundColor = "#327fa8";
    //     }
    // }
    try {
        removeNotifButton();
    } // comes from pushNotifs.ts, which is loaded before this in the html. Removes the notification button if theyre enabled
    catch (e) { }
}
function updatePins() {
    const pinString = localStorage.getItem("pins"); // retrieves "pins" item
    pins = [];
    if (pinString != null) {
        let pinArrayString = pinString.split(", ");
        for (let i = 0; i < pinArrayString.length; i++) {
            let n = parseInt(pinArrayString[i]);
            // I'm going to leave this in here, but I don't know why we should need to check for duplicates there should never be any duplicates of busses
            if (!pins.includes(n)) {
                pins.push(n);
            }
        }
    }
    var tableBody = document.getElementsByClassName("pinned-bus-table")[0].getElementsByTagName("tbody")[0];
    // var tmp : string = "";
    console.log(pins);
    tableBody.innerHTML = "";
    for (let i = 0; i < pins.length; i++) {
        tableBody.innerHTML += "<tr class='bus-row'><td class='num-col' colspan='1'>" + pins[i] + "</td><td class='status-col' colspan='5'>Loading...";
    }
}
function pinBus(button) {
    return __awaiter(this, void 0, void 0, function* () {
        // updatePins();
        // const busRow = button.parentElement!.parentElement; // this is the overarching <tr> element of the bus row
        const busNumber = button.innerText; // this is the stringification of the number of the bus
        var removing = false;
        const num = parseInt(busNumber); // this is the number of the bus
        // subscribe to the bus
        if (localStorage.getItem("pushObject") && Notification.permission === "granted") {
            // change pin icon to loading
            // button.querySelector("i")!.classList.add("fa-spinner", "fa-spin");
            // button.querySelector("i")!.classList.remove("fa-thumbtack");
            // temporary function to do recursion 'n such
            function temp(wait) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const res = yield fetch("/subscribe", {
                            headers: {
                                "Content-Type": "application/json",
                            },
                            method: "POST",
                            body: JSON.stringify({ busNumber: num, pushObject: localStorage.getItem("pushObject"), remove: removing }),
                        });
                    }
                    catch (_a) {
                        // retry with exponential backoff and recursion
                        if (wait > 5000) {
                            throw new Error("failed to contact server");
                        }
                        yield new Promise(r => setTimeout(r, wait));
                        yield temp(wait * 1.2);
                    }
                    ;
                    return "success";
                });
            }
            try {
                console.log(yield temp(256));
            }
            catch (_a) {
                alert("Bus failed to pin/unpin due to network error! Please ensure network connectivity.");
                return;
            }
            finally { // looks awful but finally actually runs before the return in the catch so it's totally fine
                // button.querySelector("i")!.classList.remove("fa-spinner", "fa-spin");
                // button.querySelector("i")!.classList.add("fa-thumbtack");
            }
        }
        if (pins.includes(num) == false) {
            pins.push(num);
            pins.sort();
            let newPinString = pins.join(", "); // representation of the pins list as a string
            localStorage.setItem("pins", newPinString);
        }
        else {
            removing = true;
            pins = pins.filter(function notNum(n) { return n != num; }); // this is how you remove elements in js arrays. pain
            pins.sort();
            if (pins.length == 0) {
                localStorage.removeItem("pins");
            }
            else {
                let newPinString = pins.join(", "); // representation of the pins list as a string
                localStorage.setItem("pins", newPinString);
            }
        }
        updatePins();
        updateTables();
    });
}
// function getRow(n: number) { // returns the row from the all-bus-table corresponding with the number input, doesn't return anything otherwise
//     let tableFull = <HTMLTableElement> document.getElementById("all-bus-table");
//     let fullRows = tableFull.rows;
//     for (let i = 2; i < fullRows.length; i++) {
//         let number = parseInt(fullRows[i]!.firstElementChild!.innerHTML)
//         if (n === number) {
//             return fullRows[i];
//         }
//     }
// }
// Set the date we're counting down to
fetch('/leavingAt')
    .then(response => response.json())
    .then(data => {
    // convert the data string to a date object
    const leavingAt = new Date(data);
    countDownDate = leavingAt; // Assign the value to countDownDate
    console.log(leavingAt);
})
    .catch(error => {
    console.error('Error:', error);
});
// Update the count down every 1 second
var x = setInterval(function () {
    return __awaiter(this, void 0, void 0, function* () {
        // Get today's date and time
        var now = new Date().getTime();
        // Find the distance between now and the count down date
        var distance = countDownDate.getTime() - now;
        // console.log("distance: " + distance);
        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        // Output the result in an element with id="demo"
        document.querySelectorAll("[id=timer]").forEach((element) => {
            element.innerHTML = "The current wave will leave in " + minutes + "min " + seconds + "sec ";
        });
        // If the count down is over, write some text 
        if (distance < 0) {
            document.querySelectorAll("[id=timer]").forEach((element) => {
                element.innerHTML = "The current wave is about to leave!";
            });
        }
    });
}, 1000);
//# sourceMappingURL=indexConnect.js.map