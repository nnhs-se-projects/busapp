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
var adminSocket = window.io("/admin");
var countDownDate = new Date();
var updatingCount = 0;
var TIMER = document.getElementById("timerDurationSelector").value;
console.log(TIMER);
adminSocket.on("update", (data) => {
    // convert from time strings to dates to allow conversion to local time
    data.allBuses.forEach((bus) => {
        if (bus.time != "")
            bus.time = new Date(bus.time);
    });
    countDownDate = new Date(data.leavingAt);
    // rerender the page
    const html = ejs.render(document.getElementById("getRender").getAttribute("render"), { data: data });
    document.getElementById("content").innerHTML = html;
    // update the timer input to match the actual value
    var timerValue = document.getElementById("timerDurationSelector");
    if (timerValue !== null) {
        timerValue.value = TIMER;
    }
});
function update() {
    adminSocket.emit("updateMain", {
        type: "update",
    });
}
function lockWave() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetchWithAlert("/lockWave", "POST", {}, {});
        update();
    });
}
function updateTimer() {
    return __awaiter(this, void 0, void 0, function* () {
        var timerValue = document.getElementById("timerDurationSelector");
        if (timerValue === null) {
            timerValue = { value: 1 };
        }
        const res = yield fetchWithAlert("/setTimer", "POST", {
            "Content-Type": "application/json",
        }, { minutes: timerValue.value });
        if (!res.ok) {
            console.log(`Response status: ${res.status}`);
        }
        TIMER = timerValue.value;
        update();
    });
}
function updateStatus(button, status) {
    return __awaiter(this, void 0, void 0, function* () {
        let number = button.parentElement.parentElement.children[0].children[0].value;
        let time = new Date();
        let data = {
            number: number,
            time: time,
            status: status,
        };
        yield fetchWithAlert("/updateBusStatus", "POST", {
            "Content-Type": "application/json",
        }, data);
        update();
    });
}
function sendWave() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetchWithAlert("/sendWave", "POST", {}, {});
        update();
    });
}
function addToWave(button) {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateStatus(button, "Loading");
    });
}
function removeFromWave(button) {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateStatus(button, "");
    });
}
function addToNextWave(button) {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateStatus(button, "Next Wave");
    });
}
function reset(button) {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateStatus(button, "");
    });
}
function resetAllBusses(button) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetchWithAlert("/resetAllBusses", "POST", {}, {});
        update();
    });
}
function updateBusChange(button) {
    return __awaiter(this, void 0, void 0, function* () {
        // children are number, change, time, status
        let number = button.parentElement.parentElement.children[0].children[0].value;
        let change = button.parentElement.parentElement.children[1].children[0].value;
        let time = new Date();
        let data = {
            number: number,
            change: change,
            time: time,
        };
        yield fetchWithAlert("/updateBusChange", "POST", {
            "Content-Type": "application/json",
        }, data);
        update();
    });
}
// Set the date we're counting down to
fetch("/leavingAt")
    .then((response) => response.json())
    .then((data) => {
    // convert the data string to a date object
    const leavingAt = new Date(data);
    countDownDate = leavingAt; // Assign the value to countDownDate
    console.log(leavingAt);
})
    .catch((error) => {
    console.error("Error:", error);
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
            element.innerHTML =
                "The current wave will leave in " + minutes + "min " + seconds + "sec ";
        });
        // If the count down is over, write some text
        if (distance < 0) {
            document.querySelectorAll("[id=timer]").forEach((element) => {
                element.innerHTML = "The current wave is about to leave!";
            });
        }
    });
}, 1000);
// requires global variable updatingcount
// functions like the fetch command, but shows the loading alert message to show if the app is actually working on it
function fetchWithAlert(endpoint, method, header, data) {
    return __awaiter(this, void 0, void 0, function* () {
        updatingCount++;
        setLoadingState(true);
        var response;
        try {
            response = yield fetch(endpoint, {
                method: method,
                headers: header,
                body: JSON.stringify(data),
            });
            if ((yield response.text()) !== "success") {
                throw (new Error("Non-success response recieved. You were most likely logged out and need to log back in."));
            }
        }
        catch (error) {
            console.error("Error:", error);
            alert("There was an error when processing the request. Please try reloading, and contact Bus App devs if the issue persists.\n\n" + error);
        }
        finally {
            updatingCount--;
            if (updatingCount == 0) {
                setLoadingState(false);
            }
            else {
                setLoadingState(true);
            }
            return response;
        }
    });
}
// sets the loading state for the "Loading" popup
function setLoadingState(option) {
    return __awaiter(this, void 0, void 0, function* () {
        var div = document.getElementsByClassName("popup")[0];
        if (div) {
            if (option) {
                div.style.animationName = "slide";
                div.style.animationPlayState = "paused";
            }
            else {
                div.style.animationPlayState = "running";
            }
        }
    });
}
//# sourceMappingURL=adminConnect.js.map