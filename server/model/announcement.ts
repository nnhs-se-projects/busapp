/**
 * schema for a journal entry
 */
export {};
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    announcement: {
        type: String,
        required: true,
    },
    tvAnnouncement: {
        type: String,
        required: true,
    },
});

const Announcement = mongoose.model("Announcement", schema);

module.exports = Announcement;