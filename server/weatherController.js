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
exports.startWeather = void 0;
const jsonHandler_1 = require("./jsonHandler");
const node_fetch_1 = __importDefault(require("node-fetch"));
// Code to update weather automcatically every 5 minutes
function getWeather(io) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield (0, node_fetch_1.default)("http://api.weatherapi.com/v1/current.json?"
                + new URLSearchParams([["key", "8afcf03c285047a1b6e201401222202"], ["q", "60563"]]));
            yield (0, jsonHandler_1.writeWeather)(yield res.json());
            io.of("/admin").emit("updateWeather", (yield (0, jsonHandler_1.readData)()).weather);
        }
        catch (error) {
            console.log('failed to fetch data from weatherapi.com', error);
        }
    });
}
function startWeather(io) {
    getWeather(io);
    setInterval(() => { getWeather(io); }, 300000);
}
exports.startWeather = startWeather;
//# sourceMappingURL=weatherController.js.map