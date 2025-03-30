var pinButtons = document.getElementsByClassName("pin-button");
var indexSocket = window.io('/'); // This line and the line above is how you get ts types to work on clientside... cursed
// !!! do NOT import/export anything or ejs will get angry

var countDownDate = new Date();
var timerDuration = 0;
var isLocked = false;

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

    const html = ejs.render(document.getElementById("getRender").getAttribute("render"), {data: data});
    document.getElementById("content").innerHTML = html;


    updatePins();
    updateNotifButton();
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
        for (let i = 0; i < pinArrayString.length; i++) {
            let n = parseInt(pinArrayString[i]);
            // I'm going to leave this in here, but I don't know why we should need to check for duplicates there should never be any duplicates of busses
            if (!pins.includes(n)) { pins.push(n); }
        }
    }

    var tableBody = document.getElementsByClassName("pinned-bus-table")[0].getElementsByTagName("tbody")[0];
    // var tmp : string = "";
    tableBody.innerHTML = ""; 
    for (let i = 0; i < pins.length; i++) {
        tableBody.innerHTML += "<tr class='bus-row'><td class='num-col' colspan='1'>" + pins[i] + "</td><td class='status-col' data-bus-number='" + pins[i] + "' colspan='5'></td></tr>";
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
            }
        }
    });
}

async function pinBus(button) { // pins the bus when the user clicks the button
    // updatePins();
    // const busRow = button.parentElement!.parentElement; // this is the overarching <tr> element of the bus row
    const busNumber = button.innerText; // this is the stringification of the number of the bus
    var removing = false;

    const num = parseInt(busNumber); // this is the number of the bus

    // subscribe to the bus
    if(localStorage.getItem("pushObject") && Notification.permission === "granted") {
        // change pin icon to loading
        // button.querySelector("i")!.classList.add("fa-spinner", "fa-spin");
        // button.querySelector("i")!.classList.remove("fa-thumbtack");

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
            // button.querySelector("i")!.classList.remove("fa-spinner", "fa-spin");
            // button.querySelector("i")!.classList.add("fa-thumbtack");
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

    updateTables();
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
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Output the result in an element with id="demo"
    console.log(distance);
    console.log(timerDuration);
    document.querySelectorAll(".loading").forEach((element) => {
        element.style.backgroundImage = `linear-gradient(90deg, green 49% , red 51%)`;
        element.style.backgroundPosition = `${Math.max(Math.min(-distance / 10 / timerDuration + 100, 100), 0)}% 0%`;
    });

    // If the count down is over, write some text 
    if (distance < 0) {
        document.querySelectorAll(".loading").forEach((element) => {
            element.innerHTML = "About to leave!";
        });
    }
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