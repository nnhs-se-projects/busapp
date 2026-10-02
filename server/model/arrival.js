"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
// one document per bus arrival, kept permanently for analysis
const schema = new mongoose.Schema({
    busNumber: {
        type: Number,
        required: true,
    },
    // bus change in effect when the bus arrived, if any
    busChange: {
        type: Number,
        required: false,
    },
    // server time the bus was marked as arrived
    arrivedAt: {
        type: Date,
        required: true,
    },
    // school day in local time (YYYY-MM-DD), for grouping
    day: {
        type: String,
        required: true,
    },
});
schema.index({ busNumber: 1, arrivedAt: -1 });
const Arrival = mongoose.model("Arrival", schema);
module.exports = Arrival;
