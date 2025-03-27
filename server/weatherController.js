const { readData, writeWeather } = require("./jsonHandler");
// import { Server } from "socket.io";
const fetch = require ("node-fetch");

// Code to update weather automcatically every 5 minutes
async function getWeather(io) {
    try {
        // If for some reason Naperville North's coordinates change a significant amount, becoming 
        // Aurora North, or god forbid, we merge with Naperville Central after the apocalypse, 
        // and Naperville Central/North then moves to another city, you might need to change the gridpoint. 
        // Currently we are getting this url from https://api.weather.gov/points/41.7835,-88.1573
        const res = await fetch("https://api.weather.gov/gridpoints/LOT/58,68/forecast/hourly");
        await writeWeather(await res.json());
        io.of("/admin").emit("updateWeather", (await readData()).weather);
    } catch (error) {
        console.log('failed to fetch data from weather.gov', error);
    }


}

module.exports = function startWeather(io) {
    getWeather(io);
    setInterval(() => { getWeather(io) }, 300000);
}
