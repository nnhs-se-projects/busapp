"use strict";
const mongoose = require("mongoose");
let hasRegisteredConnectionListeners = false;

const connectDB = async () => {
    if (!hasRegisteredConnectionListeners) {
        mongoose.connection.on("connected", () => {
            console.log(`MongoDB connected : ${mongoose.connection.host}`);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB disconnected; continuing in degraded mode until it reconnects.");
        });

        mongoose.connection.on("error", (err) => {
            console.log("MongoDB connection error:", err.message);
        });

        hasRegisteredConnectionListeners = true;
    }

    try {
        mongoose.set("bufferCommands", false);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
    } catch (err) {
        console.log("MongoDB initial connection failed; starting without a live database.", err.message);
    }
};

module.exports = connectDB;