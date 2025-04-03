"use strict";
var indexSocket = window.io('/'); // This line and the line above is how you get ts types to work on clientside... cursed
// !!! do NOT import/export anything or ejs will get angry

var countDownDate = new Date();
var timerDuration = JSON.parse(document.getElementById("getRender").getAttribute("data")).timer;

indexSocket.on("update", (data) => {
    console.log("update received")

    // convert from time strings to dates to allow conversion to local time
    data.buses.forEach((bus) => {
        if (bus.time != "")
            bus.time = new Date(bus.time);
    });

    countDownDate = new Date(data.leavingAt);
    timerDuration = data.timer;

    const html = ejs.render(document.getElementById("getRender").getAttribute("render"), {data: data});
    document.getElementById("content").innerHTML = html;
});

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
    var timer = document.querySelector(".timer")
    if(timer) {
        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownDate.getTime() - now;
        // console.log("distance: " + distance);

        // Time calculations for minutes and seconds
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timer.style.backgroundImage = `linear-gradient(90deg, green calc(50% - 3px), red calc(50% + 3px))`;
        timer.style.backgroundPosition = `${Math.max(Math.min(-distance / 10 / timerDuration + 100, 100), 0)}% 0%`;
        if (distance < 0) { 
            timer.innerHTML = "Wave About To Leave!"; 
            // dw abt removing this, next rerender will take care of that
            timer.classList.add("shake");
        } else {
            timer.innerHTML = `${minutes ? `${minutes} Minutes` : ""} ${seconds && minutes ? `and ${seconds} Seconds` : `${seconds} Seconds`} Left In Wave`;
        }
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