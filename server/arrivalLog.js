"use strict";
const Arrival = require("./model/arrival.js");

const TIME_ZONE = "America/Chicago";

// "YYYY-MM-DD" for the given time in the school's time zone
function localDay(date) {
    return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

// Records arrivals based on a bus's status change. A bus arrives when it goes from not here
// ("") into the current or next wave. Moving from the next wave into the current wave is the
// same arrival, and leaving is not tracked.
async function recordStatusChange(bus, previousStatus, newStatus) {
    try {
        await updateLog(bus, previousStatus, newStatus);
    } catch (error) {
        // the status change already happened; a logging failure shouldn't fail the admin's command
        console.log("failed to record bus arrival", error.message);
    }
}

async function updateLog(bus, previousStatus, newStatus) {
    const inWave = (status) => status === "Loading" || status === "Next Wave";

    if (previousStatus === "" && inWave(newStatus)) {
        const now = new Date();
        await Arrival.create({
            busNumber: bus.busNumber,
            busChange: bus.busChange || undefined,
            arrivedAt: now,
            day: localDay(now),
        });
    } else if (inWave(previousStatus) && newStatus === "") {
        // removed from a wave before leaving: the arrival was a mistake, so undo today's entry
        const latest = await Arrival.findOne({ busNumber: bus.busNumber, day: localDay(new Date()) }).sort("-arrivedAt");
        if (latest) await Arrival.findByIdAndDelete(latest._id);
    }
}

module.exports = { recordStatusChange };
