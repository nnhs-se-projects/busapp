import express, {Application, Request, Response} from "express";
import {router} from "./server/router";
import path from "path";
import fs, { read } from "fs";
import bodyParser from "body-parser";
import {createServer} from "http";
import {Server} from "socket.io";
import {readData, BusData, writeWhitelist} from "./server/jsonHandler";
import {startWeather} from "./server/weatherController";
import session from "express-session";
const dotenv = require("dotenv");
const connectDB = require("./server/database/connection");
const Bus = require("./server/model/bus");
const Wave = require("./server/model/wave");
const Weather = require("./server/model/weather");

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

dotenv.config({ path: ".env" });
connectDB();

const PORT = process.env.PORT || 5182;

type BusCommand = {
    type: string
    data: BusData
}

let buses: BusData[];

//root socket
io.of("/").on("connection", (socket) => {
    //console.log(`new connection on root (id:${socket.id})`);
    socket.on("debug", (data) => {
        // console.log(`debug(root): ${data}`);
    });
});

//admin socket
io.of("/admin").on("connection", async (socket) => {
    socket.on("updateMain", async (command: BusCommand) => {


        let data ={
            allBuses: (await readData()).buses,
            nextWave: await Bus.find({status: "Next Wave"}),
            loading: await Bus.find({status: "Loading"}),
            isLocked: false, 
            leavingAt: new Date(),
        };
        data.isLocked = (await Wave.findOne({})).locked;
        data.leavingAt = (await Wave.findOne({})).leavingAt;
        
        // console.log("updateMain called")

        let indexData = {
            buses: (await readData()).buses,
            isLocked: data.isLocked,
            leavingAt: data.leavingAt,
            weather: await Weather.findOne({})
        }
        
        io.of("/admin").emit("update", data);
        io.of("/").emit("update", indexData);        
    });
    socket.on("debug", (data) => {
        // console.log(`debug(admin): ${data}`);
    });
});

app.set("view engine", "ejs"); // Allows res.render() to render ejs
app.use(session({
    secret: "KQdqLPDjaGUWPXFKZrEGYYANxsxPvFMwGYpAtLjCCcN",
    resave: true,
    saveUninitialized: true
})); // Allows use of req.session
app.use(express.json());

app.use("/", router); // Imports routes from server/router.ts

app.use("/css", express.static(path.resolve(__dirname, "static/css")));
app.use("/js", express.static(path.resolve(__dirname, "static/ts")));
app.use("/img", express.static(path.resolve(__dirname, "static/img")));
app.use('/html', express.static(path.resolve(__dirname, "static/html")));

// custom 404 page - must come after all other instances of "app.use"
app.all('*', (req, res) => {
    res.status(404).render('404', {url: req.url});
});  

startWeather(io);

var now = new Date();
var milliSecondsUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0, 0).getTime() - now.getTime();
if (milliSecondsUntilMidnight < 0) {
    milliSecondsUntilMidnight += 24 * 60 * 60 * 1000; // it's after 6am, try 6am tomorrow.
}
console.log("delay: " + milliSecondsUntilMidnight);
var busResetInterval = setInterval(resetBusChanges, milliSecondsUntilMidnight); // every 24 hours
var firstRun = true;

httpServer.listen(PORT, () => {console.log(`Server is running on port ${PORT}`)});

async function resetBusChanges() {
    if(firstRun) {
        firstRun = false;
        clearInterval(busResetInterval); // clear the initial interval
        busResetInterval = setInterval(resetBusChanges, 24 * 60 * 60 * 1000); // every 24 hours
    }

    let buses = await Bus.find({});
    buses.forEach((bus: any) => { // for each bus in the database
        bus.busChange = 0; // reset the bus change
        bus.status = "normal"; // reset the bus status
        bus.save(); // save the bus
    });

    console.log("reset bus changes: " + new Date().toLocaleString());
}
