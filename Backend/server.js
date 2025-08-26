const express = require("express");
const cors = require("cors"); // Add this
const dotenv = require("dotenv");
const connectDB = require("./config/db");


// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());




// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export app for testing
module.exports = app;