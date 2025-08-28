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
app.use(cors());

// ===== Routes =====
app.use("/api/centers", require("./routes/centers.routes"));
app.use("/api/tests", require("./routes/tests.routes"));
app.use("/api/center-services", require("./routes/centerService.routes"));

// Root endpoint (for quick check)
app.get("/", (req, res) => {
  res.send("API is running ✅");
});

// ===== Error handler =====
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Server error" });
});



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export app for testing
module.exports = app;