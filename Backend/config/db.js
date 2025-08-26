const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI); // No need for extra options in Mongoose v4+
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
