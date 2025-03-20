
/**
 * schema for a journal entry
 */
export {};
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    busNumber: {
        type: Number,
        required: true,
    },
    busChange: {
        type: Number,
        required: false,
    },
    status: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        required: false,
    },
});

const Bus = mongoose.model("Bus", schema);

module.exports = Bus;