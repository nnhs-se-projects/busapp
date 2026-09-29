"use strict";
const Bus = require("./model/bus.js");
const Wave = require("./model/wave.js");
const Weather = require("./model/weather.js");
const Announcement = require("./model/announcement.js");
const { getBuses } = require("./DBHandler.js");

let io;
let getTimer = () => 30;

// Every broadcast carries a version so clients can ignore a snapshot that is older than one
// they already rendered (e.g. an HTTP resync that finishes after a newer socket update).
// Starting from the boot time keeps versions increasing across server restarts.
let version = Date.now();

function init(socketServer, timerGetter) {
    io = socketServer;
    getTimer = timerGetter;
}

// the version is read BEFORE the database so a snapshot is never labeled newer than its data
function nextVersion() { return ++version; }
function currentVersion() { return version; }

async function getAdminState(stateVersion = currentVersion()) {
    const wave = await Wave.findOne({});
    return {
        version: stateVersion,
        allBuses: await getBuses(),
        nextWave: await Bus.find({status: "Next Wave"}).sort("order"),
        loading: await Bus.find({status: "Loading"}).sort("order"),
        isLocked: wave.locked,
        leavingAt: wave.leavingAt,
        timer: getTimer(),
    };
}

async function getIndexState(adminState) {
    const announce = await Announcement.findOne({});
    return {
        version: adminState.version,
        buses: adminState.allBuses,
        isLocked: adminState.isLocked,
        leavingAt: adminState.leavingAt,
        weather: await Weather.findOne({}),
        announcement: announce.announcement,
        tvAnnouncement: announce.tvAnnouncement,
        timer: adminState.timer,
    };
}

// Broadcasts run one at a time so they can never be emitted out of order. Requests that
// arrive while one is running are collapsed into a single follow-up broadcast.
let running = null;
let pending = false;

function broadcastUpdate() {
    if (!io) return Promise.resolve();
    if (running) {
        pending = true;
        return running;
    }
    running = (async () => {
        do {
            pending = false;
            try {
                const adminState = await getAdminState(nextVersion());
                const indexState = await getIndexState(adminState);
                io.of("/admin").emit("update", adminState);
                io.of("/").emit("update", indexState);
            } catch (error) {
                console.log("failed to broadcast update", error.message);
                io.of("/admin").emit("updateError", "Database temporarily unavailable");
            }
        } while (pending);
        running = null;
    })();
    return running;
}

module.exports = {init, broadcastUpdate, getAdminState};
