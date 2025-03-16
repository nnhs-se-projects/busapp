"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    Email: {
        type: String,
        required: true
    }
});
const Admin = mongoose.model("Admin", schema);
module.exports = Admin;
//# sourceMappingURL=admin.js.map