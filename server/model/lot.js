"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    rowA: {
        type: [Number],
        required: true,
    },
    rowB: {
        type: [Number],
        required: true,
    },
});
const Lot = mongoose.model("Lot", schema);
module.exports = Lot;