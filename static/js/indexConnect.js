"use strict";
var pinButtons = document.getElementsByClassName("pin-button");
var indexSocket = window.io('/'); // This line and the line above is how you get ts types to work on clientside... cursed
// !!! do NOT import/export anything or ejs will get angry

var countDownDate = new Date();
var weather;
var firstUpdateHappened = false;

var pins = [];
var notifStatus = {};
var version = +(document.getElementById("whatsNewVersion")).value;

var initialData = JSON.parse(document.getElementById("getRender").getAttribute("data"));
var buses = initialData.buses;
var isLocked = initialData.isLocked;
var timerDuration = initialData.timer;

const oldAnnouncement = localStorage.getItem("lastAnnouncement");

// var panelExpanded = false;

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
    firstUpdateHappened = true;

    const menuOpen = document.querySelector(".dropdown-toggle").classList.contains("show");
    const menuScroll = $(".dropdown-menu").scrollTop();
    const html = ejs.render(document.getElementById("getRender").getAttribute("render"), {data: data});
    document.getElementById("content").innerHTML = html;
    if(menuOpen) {
        $('.dropdown-toggle').dropdown("toggle");
        $(".dropdown-menu").scrollTop(menuScroll);
    };

    announcementAlert(data.announcement)
    updatePins();
    updateWeather();
});

function hideWhatsNew(version) {
    document.getElementById('whatsNewPopup').style.display='none'
    localStorage.setItem("whatsNewVersion", String(version));
    localStorage.setItem("firstLoad", "ae");
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

var lastUpdateAnnouncement;
function announcementAlert(announcement) {
    if(announcement !== oldAnnouncement && announcement !== "") {
        localStorage.setItem("lastAnnouncement", announcement);
        if(lastUpdateAnnouncement !== announcement)document.querySelector(".announcement-div").animate(
            [{ backgroundColor: 'var(--lighter-blue)' }, { backgroundColor: 'var(--space-cadet)' }],
            { duration: 200, iterations: 11, direction: 'alternate' }
          );
          lastUpdateAnnouncement = announcement;
    } else if(announcement !== "") {
        const ribbon = document.getElementById("announcementRibbon");
        ribbon.parentElement.removeChild(ribbon);
    } else {
        localStorage.setItem("lastAnnouncement", announcement);
    }
}

var tooltips = {};
var idCounter = 0;
function addToolTip(elem, text) {
    const tooltip = document.createElement("div");
    tooltip.innerHTML = text;
    tooltip.classList.add("tool-tip")
    const uuid = ++idCounter;
    tooltips[uuid] = elem;
    tooltip.setAttribute("elem", uuid);
    elem.appendChild(tooltip);
    setToolTipPosition(tooltip);
    elem.addEventListener("click", (e) => {tooltip.style.display='none'; e.stopPropagation() })
    return tooltip;
}

var positions = {};

function setToolTipPosition(tooltip) {
    tooltip.style.transform = `translateY(0px)`;
    const boundingBox = tooltips[tooltip.getAttribute("elem")].getBoundingClientRect();
    const otherBound = tooltip.getBoundingClientRect();
    const offset = boundingBox.bottom - otherBound.top;
    tooltip.style.transform = `translateY(${offset + 6}px)`;
    tooltip.style.left = Math.max(0, boundingBox.left + window.scrollX - ((tooltip.getBoundingClientRect().width - boundingBox.width) / 2)) + "px";
    tooltip.style.right = 0;
}

var alreadyVibrated = [];

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

    // update in the cookie as well for the extension
    document.cookie = "pins=" + pins.join(", ") + "; SameSite=None; Secure=true; Max-Age=31536000";

    var tableBody = document.getElementsByClassName("pinned-bus-table")[0].getElementsByTagName("tbody")[0];
    // var tmp : string = "";
    tableBody.innerHTML = ""; 
    for (let i = 0; i < pins.length; i++) {
        tableBody.innerHTML += "<tr class='bus-row'><td class='num-col' colspan='1'>" + pins[i] + "</td><td class='time-col'></td><td class='status-col' data-bus-number='" + pins[i] + "' colspan='5'></td></tr>";
    }

    const statusCells = document.querySelectorAll('.status-col')
    
    statusCells.forEach(cell => {
        const busNumber = parseInt(cell.getAttribute('data-bus-number') || '0');
        const busInfo = buses.find(bus => bus.number === busNumber)
        
        if (busInfo) {
            cell.textContent = busInfo.status || 'Not Here'; // Or whatever property you want to display
            if(busInfo.status === "Loading") {
                cell.style.backgroundColor = "green";
                // dw about removing this class, thatll happen on the next rerender anyway...
                if(isLocked) {
                    cell.classList.add("loading");
                    if(firstUpdateHappened && !alreadyVibrated.includes(busInfo.number) && pins.includes(busInfo.number) && window.navigator.vibrate) {
                        if(navigator.vibrate(1000)) {
                            alreadyVibrated.push(busInfo.number);
                        }
                    }
                } else {
                    alreadyVibrated.pop(busInfo.number);
                }

                cell.innerHTML += " @" + (busInfo.order+1);

                const container = cell.parentElement.parentElement;
                if(container === document.querySelector(".pinned-bus-table > tbody") && busInfo.status === "Loading") container.prepend(cell.parentElement);
            } else if(busInfo.status === "Gone") {
                cell.parentElement.style.filter = "brightness(0.75) grayscale(0.75) ";
                cell.parentElement.parentElement.append(cell.parentElement);
            }
            if(busInfo.time) {
                cell.parentElement.querySelector(".time-col").innerHTML = (new Date(busInfo.time)).toLocaleTimeString("en-US", {hour: 'numeric', minute:'2-digit'})
            } else {
                var avgTime = "Unknown";
                if(busInfo.busTimes.length !== 0) {
                    // get the sum of all the minutes since midnight of each bus arrival and average them
                    var sum = 0; for(var i of busInfo.busTimes.map((e) => {e = new Date(e); return e.getHours()*60 + e.getMinutes()})) { sum += i; }
                    const avgMinutes = sum / busInfo.busTimes.length;
                    // convert back to Date object
                    avgTime = (new Date(1970, 0, 1, Math.floor(avgMinutes/60), avgMinutes%60, 0)).toLocaleTimeString("en-US", {hour: 'numeric', minute:'2-digit'});
                }
                const timeCol = cell.parentElement.querySelector(".time-col");
                timeCol.innerHTML = "<span style='color: gray;'>" + avgTime + "</span>";
                timeCol.style.setProperty("--text-shadow-color", "#69696969");
            }
            if(busInfo.change) {
                cell.parentElement.querySelector(".num-col").innerHTML = busInfo.number + "➔" + busInfo.change;
            }
        }
    });

    for(const i of document.querySelector(".dropdown-menu").children) {
        // if there is a bus change we need to strip that extra stuff
        if(pins.includes(+i.querySelector("button").innerHTML.replace(/➔(.*)/, ""))) {
            i.style.filter = "grayscale(0.5)";
            // button.textContent += " - Pinned";
        } else {
            i.style.filter = "";
            // button.textContent = button.textContent.split(" ")[0];
        }
    }
    updateTimers()
}

function updateWeather() {
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
        button.appendChild(document.createElement("i"));
        button.querySelector("i").classList.add("fa-solid", "fa-spinner", "fa-spin");

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

var minutes = 0;
var seconds = 0;
// Update the count down every second
async function updateTimers() {
    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate.getTime() - now;
    // console.log("distance: " + distance);

    // Time calculations for days, hours, minutes and seconds
    //var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    //var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Output the result in an element with id="demo"
    document.querySelectorAll(".loading").forEach((element) => {
        element.style.backgroundImage = `linear-gradient(90deg, green 49% , red 51%)`;
        element.style.backgroundPosition = `${Math.max(Math.min(-distance / 10 / timerDuration + 100, 100), 0)}% 0%`;
        if (distance < 0) { 
            element.innerHTML = element.innerHTML.replace("Loading", "About to leave"); // keeps position (About to leave! @1,2,3...)
        }
        if(pins.includes(+element.getAttribute("data-bus-number"))) {
            element.style.filter = "";
        } else {
            element.style.filter = "grayscale(0.75)";
        }
    });

    if(isLocked)document.getElementById("timer").innerHTML = minutes + seconds > 0 ? ` - ${minutes}:${String(seconds).padStart(2, "0")}` : "";
}
var x = setInterval(updateTimers, 500);


// When the app gets put into the background, the browser pauses execution of the code.
// This frequently causes the bus app to miss updates, and means it has to be reloaded or restarted.
// rerender the page once it regains focus to prevent this issue.

document.addEventListener("visibilitychange", async (event) => {
    // once the page is visible again, we reload it!
    if (document.visibilityState === "visible") { await forceUpdatePage(); }
});

const checkWeather = setInterval(async function() {
    weather = await (await fetch("/getWeather")).json();
    updateWeather();
}, 1000 * 60 * 30);


async function forceUpdatePage() {
    console.log("Force update called!");

    try {
        const apiData = await (await fetch(`/api?key=${initialData.apiKey}`, {cache: "no-store"})).json()

        // convert from time strings to dates to allow conversion to local time
        apiData.buses.forEach((bus) => {
            if (bus.time != "")
                bus.time = new Date(bus.time);
        });

        countDownDate = new Date(apiData.wave.leavingAt);
        timerDuration = apiData.timerDuration;
        buses = apiData.buses;
        isLocked = apiData.wave.locked;
        weather = await (await fetch("/getWeather")).json();

        const data = {};
        data.buses = apiData.buses;
        data.weather = weather;
        data.isLocked = apiData.wave.locked;
        data.leavingAt = apiData.wave.leavingAt;
        data.announcement = apiData.announcement.announcement;
        data.timer = apiData.timerDuration;

        const menuOpen = document.querySelector(".dropdown-toggle").classList.contains("show");
        const menuScroll = $(".dropdown-menu").scrollTop();
        const html = ejs.render(document.getElementById("getRender").getAttribute("render"), {data: data});
        document.getElementById("content").innerHTML = html;
        if(menuOpen) {
            $('.dropdown-toggle').dropdown("toggle");
            $(".dropdown-menu").scrollTop(menuScroll);
        };

        announcementAlert(data.announcement);
        updateWeather();
        updatePins();
    } catch(e) {
        setIndicatorStatus("offline");
        // server may have restarted, get the new API key
        window.location.reload();
    }
}



updatePins();
updateNotifButton();
navigator.serviceWorker?.register('/serviceWorker.js', { scope: '/' });

if(!localStorage.getItem("whatsNewVersion") || +localStorage.getItem("whatsNewVersion") < version) {
    document.getElementById('whatsNewPopup').style.display='block';
}
if(!localStorage.getItem("firstLoad")) {
    document.querySelectorAll(".has-tooltip")
        .forEach(e => addToolTip(e, e.getAttribute("tooltip-text")));

    window.setInterval((e) => {
        document.querySelectorAll(".tool-tip").forEach(tooltip => setToolTipPosition(tooltip));
    }, 500);    
}

announcementAlert(initialData.announcement);
if("mediaSession" in navigator && 
    document.pictureInPictureEnabled && 
    !!document.createElement("canvas").getContext) {
    document.getElementById("popoutToggler").style.display = "block";
}

if(window.chrome) document.getElementById("extensionButton").style.display = "block";