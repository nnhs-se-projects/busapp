"use strict";

const express = require("express");
const path = require("path");
const {createServer} = require("http");
const {Server} = require("socket.io");
const session = require("express-session");
const dotenv = require("dotenv");
const connectDB = require("./server/database/connection.js");
const mongoose = require("mongoose");
const Bus = require("./server/model/bus.js");
const Wave = require("./server/model/wave.js");
const { init: initBroadcast, broadcastUpdate } = require("./server/broadcast.js");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

let router;
let getTimer;
let startWeather;

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 5182;

//root socket
io.of("/").on("connection", (socket) => {
    //console.log(`new connection on root (id:${socket.id})`);
    socket.on("debug", (data) => {
        // console.log(`debug(root): ${data}`);
    });
});

//admin socket
io.of("/admin").on("connection", async (socket) => {
    // kept for pages that still ask for a refresh; mutating routes now broadcast on their own
    socket.on("updateMain", () => { broadcastUpdate(); });
    socket.on("debug", (data) => {
        // console.log(`debug(admin): ${data}`);
    });
});

app.set("view engine", "ejs"); // Allows res.render() to render ejs
app.use(session({
    secret: require('crypto').randomBytes(48).toString('base64'),
    resave: true,
    saveUninitialized: true
})); // Allows use of req.session
app.use(express.json());

app.use("/css", express.static(path.resolve(__dirname, "static/css")));
app.use("/js", express.static(path.resolve(__dirname, "static/js")));
app.use("/img", express.static(path.resolve(__dirname, "static/img")));
app.use('/html', express.static(path.resolve(__dirname, "static/html")));

async function bootstrap() {
    await connectDB();

    ({router, getTimer} = require("./server/router.js"));
    initBroadcast(io, getTimer);
    startWeather = require("./server/weatherController.js");

    app.use("/", router); // Imports routes from server/router.js

    // custom 404 page - must come after all other instances of "app.use"
    app.all('*', (req, res) => {
        res.status(404).render('404', {url: req.url});
    });  

    app.use((error, req, res, next) => {
        if (res.headersSent) {
            return next(error);
        }

        const mongoErrorNames = new Set([
            "MongooseServerSelectionError",
            "MongoServerSelectionError",
            "MongoNetworkError",
            "MongoNetworkTimeoutError",
            "DisconnectedError",
            "MongooseError",
        ]);
        const errorText = `${error?.name || ""} ${error?.message || ""}`;
        const databaseUnavailable = [...mongoErrorNames].some((name) => errorText.includes(name));
        console.log("request failed", error);

        if (databaseUnavailable) {
            res.status(503).send("Database temporarily unavailable. Please try again later.");
            return;
        }

        res.status(500).send("Internal server error");
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
        try {
            if(firstRun) {
                firstRun = false;
                clearInterval(busResetInterval); // clear the initial interval
                busResetInterval = setInterval(resetBusChanges, 24 * 60 * 60 * 1000); // every 24 hours
            }

            await Bus.updateMany({}, { $set: { status: "", order: 0, busChange: 0 } }); 
            await Wave.updateMany({}, { $set: { locked: false } })
            broadcastUpdate();

            console.log("reset bus changes: " + new Date().toLocaleString());
        } catch (error) {
            console.log("failed to reset bus changes", error.message);
        }
    }
}

bootstrap().catch((error) => {
    console.log("server bootstrap failed", error);
    process.exit(1);
});
