
/**
 * schema for a journal entry
 */
export {};
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    locked: {
        type: Boolean,
        required: true,
    },
    leavingAt: {
        type: Date,
        required: true,
    }
});

const Wave = mongoose.model("Wave", schema);

module.exports = Wave;