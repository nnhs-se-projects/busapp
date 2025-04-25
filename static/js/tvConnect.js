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
            timer.innerHTML = `${minutes ? `${minutes} Minute${ minutes > 1 ? "s" : "" }` : ""} ${seconds && minutes ? `and ${seconds} Seconds` : `${seconds} Seconds`} Left In Wave`;
        }
    }
}, 1000);

// reload every 5 mins in case the app dies
setInterval(() => {
    window.location.reload();
}, 1000 * 60 * 5);