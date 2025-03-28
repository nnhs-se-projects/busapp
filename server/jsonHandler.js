const path = require("path");
const fs = require("fs");

// const whitelistDatafile = path.resolve(__dirname, "../data/whitelist.json");
const Announcement = require("./model/announcement.js");
const Bus = require("./model/bus.js");
const Weather = require("./model/weather.js");

//export type BusData = {number: string, change: string | undefined, time: string | undefined, status: string | undefined};
//export type adminData = {address: string};

async function getBuses() {
    // get all the buses and create a list of objects like the following {number:,change:,time:,status:}
    const buses = await Bus.find({});
    const busList = [];
    buses.forEach((bus) => {
        busList.push({number: bus.busNumber, change: bus.busChange, time: bus.time, status: bus.status});
    });
    // if change is 0, make it an empty string
    busList.forEach((bus) => {
        if (bus.change === 0) bus.change = "";
        if(bus.time == undefined) bus.time = new Date();
        if (bus.status === "normal") bus.status = "";
        // bus.time = bus.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        if(bus.status === "") bus.time = "";
    });

    // sort the list by bus number
    busList.sort((a, b) => {
        return a.number - b.number;
    });

    return busList;
}


// Load data file. If no file exists creates one
async function readData() {

    
    const weather = await Weather.findOne({})
    let buses = await getBuses();

    return {buses: buses, weather: weather, announcement: (await Announcement.findOne({})).announcement};
}

async function writeWeather(weather) {
        const doc = await Weather.findOneAndUpdate({}, {
            status: weather.properties.periods[0].shortForecast,
            icon: weather.properties.periods[0].icon.replace(/,.*$/, "?size=500"),
            temperature: weather.properties.periods[0].temperature,
            // feelsLike: weather.periods[0].temperature,
        }, {upsert: true, returnDocument: "after"});
    
}
/*
// Reads a list of users who are allowed access to the admin page
export function readWhitelist(): {admins} {
    return {admins: JSON.parse(fs.readFileSync(whitelistDatafile, "utf-8"))};
}

export function writeWhitelist(data) {
    let oldWhitelist = readWhitelist().admins;
    oldWhitelist.push(data)
    fs.writeFileSync(whitelistDatafile, JSON.stringify(oldWhitelist));
}*/

module.exports = {getBuses, readData, writeWeather};