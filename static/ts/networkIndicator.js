"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var lastStatus = "connected";
// sets the look of the indicator based on a supplied status 
function setIndicatorStatus(stat) {
    const indicator = document.getElementById("networkIndicator");
    const blocker = document.getElementById("networkBlocker");
    const content = document.getElementById("content");
    if (stat === "connected") {
        indicator.style.backgroundColor = "green";
        indicator.innerHTML = '<i class="fa-solid fa-check"></i>';
        document.body.style.overflow = "";
        blocker === null || blocker === void 0 ? void 0 : blocker.classList.remove("shown");
    }
    else if (stat === "slow") {
        indicator.style.backgroundColor = "yellow";
        indicator.innerHTML = '<i class="fa-solid fa-exclamation"></i>';
        document.body.style.overflow = "";
        blocker === null || blocker === void 0 ? void 0 : blocker.classList.remove("shown");
    }
    else if (stat === "offline") {
        indicator.style.backgroundColor = "red";
        indicator.innerHTML = '<i class="fa-solid fa-exclamation"></i>';
        document.body.style.overflow = "hidden";
        blocker === null || blocker === void 0 ? void 0 : blocker.classList.add("shown");
    }
    lastStatus = stat;
}
// sends a sort of ping to the server, and evaluates connection status based on latency and whether the request failed
function checkNetworkConnectivity() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var ping = performance.now();
            const response = yield fetch("/getConnectivity", { cache: "no-store" });
            ping = performance.now() - ping;
            if (response.ok) {
                if (ping < 450) {
                    return "connected";
                }
                return "slow";
            }
        }
        catch (e) {
            return "offline";
        }
        return "offline";
    });
}
// run checkNetworkConnectivity() and setIndicatorStatus()
function checkAndChange() {
    return __awaiter(this, void 0, void 0, function* () {
        const stat = yield checkNetworkConnectivity();
        if (stat === "offline") {
            // double check before blocking stuff
            if (stat === (yield checkNetworkConnectivity())) {
                setIndicatorStatus(stat);
            }
        }
        else {
            setIndicatorStatus(stat);
        }
    });
}
// run checkAndChange whenever the network status changes and periodically in case the other events dont fire
window.addEventListener('online', () => checkAndChange());
window.addEventListener('offline', () => checkAndChange());
checkAndChange();
setInterval(checkAndChange, 8000);
//# sourceMappingURL=networkIndicator.js.map