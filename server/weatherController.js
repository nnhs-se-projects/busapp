const { readData, writeWeather } = require("./jsonHandler");
// import { Server } from "socket.io";
const fetch = require ("node-fetch");

// Code to update weather automcatically every 5 minutes
async function getWeather(io) {
    try {
        const res = await fetch("http://api.weatherapi.com/v1/current.json?"
            + new URLSearchParams([["key", "8afcf03c285047a1b6e201401222202"], ["q", "60563"]]
            ));
        await writeWeather(await res.json());
        io.of("/admin").emit("updateWeather", (await readData()).weather);
    } catch (error) {
        console.log('failed to fetch data from weatherapi.com', error);
    }


}

module.exports = function startWeather(io) {
    getWeather(io);
    setInterval(() => { getWeather(io) }, 300000);
}
