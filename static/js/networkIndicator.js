"use strict";
var lastStatus = "connected";

// sets the look of the indicator based on a supplied status 
async function setIndicatorStatus(stat) {
    const indicator = document.getElementById("networkIndicator");
    const blocker = document.getElementById("networkBlocker");
    const content = document.getElementById("content");
    if(stat === "connected") {
        indicator.style.backgroundColor = "green";
        indicator.innerHTML = '<i class="fa-solid fa-check"></i>';
        blocker.classList.remove("shown");
    } else if(stat === "slow") {
        indicator.style.backgroundColor = "yellow";
        indicator.innerHTML = '<i class="fa-solid fa-exclamation"></i>';
        blocker.classList.remove("shown");
    } else if(stat === "offline") {
        indicator.style.backgroundColor = "red";
        indicator.innerHTML = '<i class="fa-solid fa-exclamation"></i>';
        blocker.classList.add("shown");
    }
    if((stat === "slow" || stat === "connected") && lastStatus === "offline") {
        await forceUpdatePage();
    }
    lastStatus = stat;
}


// sends a sort of ping to the server, and evaluates connection status based on latency and whether the request failed
async function checkNetworkConnectivity() {
    try {
        var ping = performance.now();
        const response = await fetch("/getConnectivity", {cache: "no-store"});
        ping = performance.now() - ping;
        if(response.ok) {
            if(ping < 500) { return "connected"; }
            return "slow";
        }
    } catch(e) {
        return "offline";
    }
    return "offline";
}

// run checkNetworkConnectivity() and setIndicatorStatus()
async function checkAndChange() {
    const stat = await checkNetworkConnectivity()
    if(stat === "offline") {
        // double check before blocking stuff
        await new Promise(resolve => setTimeout(resolve, 3000));
        if(stat === await checkNetworkConnectivity()) { await setIndicatorStatus(stat); }
    } else {
        await setIndicatorStatus(stat);
    }
}

async function checkAndChangeRecursive() {
    await checkAndChange();
    setTimeout(checkAndChangeRecursive, lastStatus === "offline" ? 1000 : 5000);
}

// run checkAndChange whenever the network status changes and periodically in case the other events dont fire
window.addEventListener('online', () => checkAndChange());
window.addEventListener('offline', () => checkAndChange());
checkAndChangeRecursive();
//setInterval(checkAndChange, 10000); // check connection every 10 seconds