"use strict";
var pinButtons = document.getElementsByClassName("pin-button");
var indexSocket = window.io('/'); // This line and the line above is how you get ts types to work on clientside... cursed
// !!! do NOT import/export anything or ejs will get angry

var countDownDate = new Date();
var timerDuration = 0;
var isLocked = false;
var weather;

var pins = [];
var notifStatus = {};
var buses;


var panelExpanded = false;

// end of initializing stuff

indexSocket.on("update", (data) => {
    console.log("update received")

    // convert from time strings to dates to allow conversion to local time
    data.buses.forEach((bus) => {
        if (bus.time != "")
            bus.time = new Date(bus.time);
    });

    countDownDate = new Date(data.leavingAt);
    timerDuration = data.timer;
    buses = data.buses;
    isLocked = data.isLocked;
    weather = data.weather;

    const html = ejs.render(document.getElementById("getRender").getAttribute("render"), {data: data});
    document.getElementById("content").innerHTML = html;


    updatePins();
    updateNotifButton();
    updateWeather();
});

function hideWhatsNew(version) {
    document.getElementById('whatsNewPopup').style.display='none'
    localStorage.setItem("whatsNewVersion", String(version));
}

function toggleCredits() {
    const elem = document.getElementById('credits')
    if(elem.style.display==='') {
        elem.style.display = "block";
        elem.style.animationPlayState = "running";
    } else {
        elem.style.display = '';
        elem.style.animationPlayState = "paused";
    }
}

window.onload = async () => {
    var version = +(document.getElementById("whatsNewVersion")).value;
    if(!localStorage.getItem("whatsNewVersion") || +localStorage.getItem("whatsNewVersion") < version) {
        document.getElementById('whatsNewPopup').style.display='block';
    }

    var initialData = JSON.parse(document.getElementById("getRender").getAttribute("data"));
    buses = initialData.buses;
    isLocked = initialData.isLocked;
    timerDuration = initialData.timer;

    updatePins();
    updateNotifButton();
};


function updatePins() { // guess what
    const pinString = localStorage.getItem("pins");  // retrieves "pins" item
    pins = [];
    if (pinString != null) {
        let pinArrayString = pinString.split(", ");
        var busNumberArray = buses.map(e => e.number);
        for (let i = 0; i < pinArrayString.length; i++) {
            let n = parseInt(pinArrayString[i]);
            // check for duplicate pins and make sure pinned bus actually exists
            if (!pins.includes(n) && busNumberArray.includes(n)) { pins.push(n); }
        }
    }

    var tableBody = document.getElementsByClassName("pinned-bus-table")[0].getElementsByTagName("tbody")[0];
    // var tmp : string = "";
    tableBody.innerHTML = ""; 
    for (let i = 0; i < pins.length; i++) {
        tableBody.innerHTML += "<tr class='bus-row'><td class='num-col' colspan='1'>" + pins[i] + "</td><td class='time-col'></td><td class='status-col' data-bus-number='" + pins[i] + "' colspan='5'></td></tr>";
    }

    const statusCells = document.querySelectorAll('.status-col');
    statusCells.forEach(cell => {
        const busNumber = parseInt(cell.getAttribute('data-bus-number') || '0');
        const busInfo = buses.find(bus => bus.number === busNumber);
        if (busInfo) {
            cell.textContent = busInfo.status || 'Not Here'; // Or whatever property you want to display
            if(busInfo.status === "Loading") {
                cell.style.backgroundColor = "green";
                // dw about removing this class, thatll happen on the next rerender anyway...
                if(isLocked) cell.classList.add("loading");

                cell.innerHTML += " @" + (busInfo.order+1);
            }
            if(busInfo.time) {
                cell.parentElement.querySelector(".time-col").innerHTML = (new Date(busInfo.time)).toLocaleTimeString("en-US", {hour: '2-digit', minute:'2-digit'})
            } else {
                var avgTime = "Unknown";
                if(busInfo.busTimes.length !== 0) {
                    // get the sum of all the minutes since midnight of each bus arrival and average them
                    var sum = 0; for(var i of busInfo.busTimes.map((e) => {e = new Date(e); return e.getHours()*60 + e.getMinutes()})) { sum += i; }
                    const avgMinutes = sum / busInfo.busTimes.length;
                    // convert back to Date object
                    avgTime = (new Date(1970, 0, 1, Math.floor(avgMinutes/60), avgMinutes%60, 0)).toLocaleTimeString("en-US", {hour: '2-digit', minute:'2-digit'});
                }
                cell.parentElement.querySelector(".time-col").innerHTML = "<span style='color: gray'>" + avgTime + "</span>";
            }
            if(busInfo.change) {
                cell.parentElement.querySelector(".num-col").innerHTML = busInfo.number + "&rarr;" + busInfo.change;
            }
        }
    });

    for(const i of document.querySelector(".dropdown-menu").children) {
        // if there is a bus change we need to strip that extra stuff
        if(pins.includes(+i.querySelector("button").innerHTML.replace(/→(.*)/, ""))) {
            i.style.filter = "grayscale(1)";
        } else {
            i.style.filter = "";
        }
    }
}

function updateWeather() {
    console.log("ae");
    document.body.style.backgroundImage = `url("${weather.icon}")`;
    document.getElementById("weather").innerHTML = `${weather.temperature}&deg;F ${weather.status}`;
}

async function pinBus(button) { // pins the bus when the user clicks the button
    // updatePins();
    // const busRow = button.parentElement!.parentElement; // this is the overarching <tr> element of the bus row
    const busNumber = button.innerText; // this is the stringification of the number of the bus
    const num = parseInt(busNumber); // this is the number of the bus
    var removing = pins.includes(num);

    // subscribe to the bus
    if(localStorage.getItem("pushObject") && Notification.permission === "granted") {
        // add loading icon
        button.parentElement.insertBefore(document.createElement("i"), button);
        button.parentElement.querySelector("i").classList.add("fa-solid", "fa-spinner", "fa-spin");

        // temporary function to do recursion 'n such
        async function temp(wait) {
            try { 
                const res = await fetch("/subscribe", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({busNumber: num, pushObject: localStorage.getItem("pushObject"), remove: removing}),
                })
            } catch {
                // retry with exponential backoff and recursion
                if(wait > 5000) {
                    throw new Error("failed to contact server");
                }
                await new Promise(r => setTimeout(r, wait));
                await temp(wait * 1.2);
            };
            return "success";
        }

        try {
            console.log(await temp(256))
        } catch { 
            alert("Bus failed to pin/unpin due to network error! Please ensure network connectivity.");
            return; 
        } finally { // looks awful but finally actually runs before the return in the catch so it's totally fine
            button.parentElement.querySelector("i").remove();
        }

    }

    if (pins.includes(num) == false) {
        pins.push(num);
        pins.sort();
        let newPinString = pins.join(", "); // representation of the pins list as a string
        localStorage.setItem("pins", newPinString);
    } else {
        removing = true;
        pins = pins.filter(function notNum(n) {return n != num;}); // this is how you remove elements in js arrays. pain
        pins.sort();
        if (pins.length == 0) {
            localStorage.removeItem("pins");
        } else {
            let newPinString = pins.join(", "); // representation of the pins list as a string
            localStorage.setItem("pins", newPinString);
        }
    }
    updatePins();
}

// Set the date we're counting down to
fetch('/leavingAt')
    .then(response => response.json())
    .then(data => {
        // convert the data string to a date object
        const leavingAt = new Date(data);
        
        countDownDate = leavingAt; // Assign the value to countDownDate

    })
    .catch(error => {
        console.error('Error:', error);
    });

// Update the count down every second
var x = setInterval(async function() {
    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate.getTime() - now;
    // console.log("distance: " + distance);

    // Time calculations for days, hours, minutes and seconds
    //var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    //var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    //var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    //var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Output the result in an element with id="demo"
    document.querySelectorAll(".loading").forEach((element) => {
        element.style.backgroundImage = `linear-gradient(90deg, green 49% , red 51%)`;
        element.style.backgroundPosition = `${Math.max(Math.min(-distance / 10 / timerDuration + 100, 100), 0)}% 0%`;
        if (distance < 0) { 
            element.innerHTML = "About to leave!"; 
        }
    });
}, 1000);


// When the app gets put into the background, the browser pauses execution of the code.
// This frequently causes the bus app to miss updates, and means it has to be reloaded or restarted.
// This code checks if there is a significant discrepancy in how long since the code last ran,
// if there is a discrepancy, reload the page once it regains focus.

var lastTime = (new Date()).getTime();
// set the interval for every 30 seconds
const reloadChecker = setInterval(async function() {
    var currentTime = (new Date()).getTime();
    //console.log(currentTime - lastTime);
    // check if it has been significantly more than 30 seconds, this would indicate code execution was paused or throttled
    // also check if the page is visible - if it already is then a reload wont help it
    if (currentTime > (lastTime + 40000) && document.visibilityState !== "visible") {
        document.addEventListener("visibilitychange", (event) => {
            // once the page is visible again, we reload it!
            if (document.visibilityState === "visible") { window.location.reload(); }
        });
        // clear the interval, the reload is primed and there is nothing more to be done
        clearInterval(reloadChecker);
    }
    lastTime = currentTime;
}, 30000);


const checkWeather = setInterval(async function() {
    weather = await (await fetch("/getWeather")).json();
    updateWeather();
}, 1000 * 60 * 30);