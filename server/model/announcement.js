"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=announcement.js.map