"use strict";
const mongoose = require("mongoose");

const connectDB = async () => {
    mongoose.connection.on("connected", () => {
        console.log(`MongoDB connected : ${mongoose.connection.host}`);
    });

    mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected; continuing in degraded mode until it reconnects.");
    });

    mongoose.connection.on("error", (err) => {
        console.log("MongoDB connection error:", err.message);
    });

    try {
        await mongoose.connect(process.env.MONGO_URI, {
        });
    } catch (err) {
        console.log("MongoDB initial connection failed; starting without a live database.", err.message);
    }
};

module.exports = connectDB;