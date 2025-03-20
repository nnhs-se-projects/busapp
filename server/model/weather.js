"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    temperature: {
        type: Number,
        required: true,
    },
    feelsLike: {
        type: Number,
        required: true,
    }
});
const Weather = mongoose.model("Weather", schema);
module.exports = Weather;