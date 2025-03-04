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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router_1 = require("./server/router");
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const jsonHandler_1 = require("./server/jsonHandler");
const weatherController_1 = require("./server/weatherController");
const express_session_1 = __importDefault(require("express-session"));
const dotenv = require("dotenv");
const connectDB = require("./server/database/connection");
const Bus = require("./server/model/bus");
const Wave = require("./server/model/wave");
const Weather = require("./server/model/weather");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer);
dotenv.config({ path: ".env" });
connectDB();
const PORT = process.env.PORT || 5182;
let buses;
//root socket
io.of("/").on("connection", (socket) => {
    //console.log(`new connection on root (id:${socket.id})`);
    socket.on("debug", (data) => {
        // console.log(`debug(root): ${data}`);
    });
});
//admin socket
io.of("/admin").on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    socket.on("updateMain", (command) => __awaiter(void 0, void 0, void 0, function* () {
        let data = {
            allBuses: (yield (0, jsonHandler_1.readData)()).buses,
            nextWave: yield Bus.find({ status: "Next Wave" }),
            loading: yield Bus.find({ status: "Loading" }),
            isLocked: false,
            leavingAt: new Date(),
        };
        data.isLocked = (yield Wave.findOne({})).locked;
        data.leavingAt = (yield Wave.findOne({})).leavingAt;
        // console.log("updateMain called")
        let indexData = {
            buses: (yield (0, jsonHandler_1.readData)()).buses,
            isLocked: data.isLocked,
            leavingAt: data.leavingAt,
            weather: yield Weather.findOne({})
        };
        io.of("/admin").emit("update", data);
        io.of("/").emit("update", indexData);
    }));
    socket.on("debug", (data) => {
        // console.log(`debug(admin): ${data}`);
    });
}));
app.set("view engine", "ejs"); // Allows res.render() to render ejs
app.use((0, express_session_1.default)({
    secret: "KQdqLPDjaGUWPXFKZrEGYYANxsxPvFMwGYpAtLjCCcN",
    resave: true,
    saveUninitialized: true
})); // Allows use of req.session
app.use(express_1.default.json());
app.use("/", router_1.router); // Imports routes from server/router.ts
app.use("/css", express_1.default.static(path_1.default.resolve(__dirname, "static/css")));
app.use("/js", express_1.default.static(path_1.default.resolve(__dirname, "static/ts")));
app.use("/img", express_1.default.static(path_1.default.resolve(__dirname, "static/img")));
app.use('/html', express_1.default.static(path_1.default.resolve(__dirname, "static/html")));
(0, weatherController_1.startWeather)(io);
var now = new Date();
var milliSecondsUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0, 0).getTime() - now.getTime();
if (milliSecondsUntilMidnight < 0) {
    milliSecondsUntilMidnight += 24 * 60 * 60 * 1000; // it's after 6am, try 6am tomorrow.
}
console.log("delay: " + milliSecondsUntilMidnight);
var busResetInterval = setInterval(resetBusChanges, milliSecondsUntilMidnight); // every 24 hours
var firstRun = true;
httpServer.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });
function resetBusChanges() {
    return __awaiter(this, void 0, void 0, function* () {
        if (firstRun) {
            firstRun = false;
            clearInterval(busResetInterval); // clear the initial interval
            busResetInterval = setInterval(resetBusChanges, 24 * 60 * 60 * 1000); // every 24 hours
        }
        let buses = yield Bus.find({});
        buses.forEach((bus) => {
            bus.busChange = 0; // reset the bus change
            bus.status = "normal"; // reset the bus status
            bus.save(); // save the bus
        });
        console.log("reset bus changes: " + new Date().toLocaleString());
    });
}
//# sourceMappingURL=server.js.map