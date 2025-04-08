"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    locked: {
        type: Boolean,
        required: true,
    },
    leavingAt: {
        type: Date,
        required: true,
    },
    busesInWave: {
        type: Array,
        required: true,
    }
});
const Wave = mongoose.model("Wave", schema);
module.exports = Wave;