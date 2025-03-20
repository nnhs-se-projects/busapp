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
exports.writeWhitelist = exports.readWhitelist = exports.writeWeather = exports.readData = exports.getBuses = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const whitelistDatafile = path_1.default.resolve(__dirname, "../data/whitelist.json");
const Announcement = require("./model/announcement");
const Bus = require("./model/bus");
const Weather = require("./model/weather");
function getBuses() {
    return __awaiter(this, void 0, void 0, function* () {
        // get all the buses and create a list of objects like the following {number:,change:,time:,status:}
        const buses = yield Bus.find({});
        const busList = [];
        buses.forEach((bus) => {
            busList.push({ number: bus.busNumber, change: bus.busChange, time: bus.time, status: bus.status });
        });
        // if change is 0, make it an empty string
        busList.forEach((bus) => {
            if (bus.change === 0)
                bus.change = "";
            if (bus.time == undefined)
                bus.time = new Date();
            if (bus.status === "normal")
                bus.status = "";
            // bus.time = bus.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            if (bus.status === "")
                bus.time = "";
        });
        // sort the list by bus number
        busList.sort((a, b) => {
            return a.number - b.number;
        });
        return busList;
    });
}
exports.getBuses = getBuses;
// Load data file. If no file exists creates one
function readData() {
    return __awaiter(this, void 0, void 0, function* () {
        const weather = yield Weather.findOne({});
        let buses = yield getBuses();
        return { buses: buses, weather: weather, announcement: (yield Announcement.findOne({})).announcement };
    });
}
exports.readData = readData;
function writeWeather(weather) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield Weather.findOneAndUpdate({}, {
            status: weather.current.condition.text,
            icon: weather.current.condition.icon,
            temperature: weather.current.temp_f,
            feelsLike: weather.current.feelslike_f
        }, { upsert: true, returnDocument: "after" });
    });
}
exports.writeWeather = writeWeather;
// Reads a list of users who are allowed access to the admin page
function readWhitelist() {
    return { admins: JSON.parse(fs_1.default.readFileSync(whitelistDatafile, "utf-8")) };
}
exports.readWhitelist = readWhitelist;
function writeWhitelist(data) {
    let oldWhitelist = readWhitelist().admins;
    oldWhitelist.push(data);
    fs_1.default.writeFileSync(whitelistDatafile, JSON.stringify(oldWhitelist));
}
exports.writeWhitelist = writeWhitelist;
//# sourceMappingURL=jsonHandler.js.map