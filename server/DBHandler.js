const Bus = require("./model/bus.js");

//export type BusData = {number: string, change: string | undefined, time: string | undefined, status: string | undefined};
//export type adminData = {address: string};

async function getBuses() {
    // get all the buses and create a list of objects like the following {number:,change:,time:,status:}
    const buses = await Bus.find({});
    const busList = [];
    buses.forEach((bus) => {
        // get the sum of all the minutes since midnight of each bus arrival and average them
        var sum = 0; for(var i of bus.busTimes.map((e) => e.getHours()*60 + e.getMinutes())) { sum += i; }
        var avgTime = sum / bus.busTimes.length;
        // convert back to Date object
        avgTime = new Date(1970, 0, 1, Math.floor(avgTime/60), avgTime%60, 0);
        // push data to buslist
        busList.push({number: bus.busNumber, change: bus.busChange, time: bus.time, status: bus.status, avgTime: avgTime});
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




module.exports = {getBuses};