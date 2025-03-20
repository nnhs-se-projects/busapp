
/**
 * schema for a journal entry
 */
export {};
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    Email: {
        type: String,
        required: true
    }
});

const Admin = mongoose.model("Admin", schema);

module.exports = Admin;