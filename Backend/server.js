// server.js (CommonJS)
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Import your route modules (CommonJS style)
const healthAwarenessRoutes = require("./routes/LabTests/healthAwarenessRoutes");
const testRoutes = require("./routes/LabTests/labTestRoutes");
const userChecklistRoutes = require("./routes/LabTests/userChecklistRoutes");

dotenv.config();

const app = express();

// CORS (allow all in dev)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check endpoints
app.get("/", (_req, res) => res.send("OK"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Try DB, but don't exit the server in dev
(async () => {
  try {
    await connectDB();
    console.log("Mongo connected");
  } catch (e) {
    console.error("Mongo connect failed:", e.message);
  }
})();

// Only mount the routes you actually have
app.use("/api/health-awareness", healthAwarenessRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/user-checklists", userChecklistRoutes);


app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/event-registrations", require("./routes/eventRegistrationRoutes"));
app.use("/api/lab-tests", require("./routes/labTestResultRoutes"));
app.use("/api/eventLabNotifications", require("./routes/eventLabNotificationRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/health-awareness", healthAwarenessRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/user-checklists", userChecklistRoutes);

const PORT = process.env.PORT || 5000;
// Bind to 0.0.0.0 so other devices can reach it
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on http://0.0.0.0:${PORT}`)
);

module.exports = app;
