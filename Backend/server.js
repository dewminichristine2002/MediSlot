// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

// --- Core middleware (once) ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Health checks (once) ---
app.get("/", (_req, res) => res.send("OK"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// --- Ensure uploads dir and serve static ---
const uploadsRoot = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });
app.use('/uploads', express.static(uploadsRoot));

// --- Connect DB (non-fatal on dev) ---
(async () => {
  try {
    await connectDB();
    console.log('Mongo connected');
  } catch (e) {
    console.error("Mongo connect failed:", e.message);
  }
})();

// --- Routes: mount each ONCE ---
app.use("/api/health-awareness", require("./routes/LabTests/healthAwarenessRoutes"));
app.use("/api/user-checklists", require("./routes/LabTests/userChecklistRoutes"));

// Keep ONE tests route. If you want the generic tests CRUD, use this:
app.use("/api/tests", require("./routes/tests.routes"));

// If you actually need LabTests-specific endpoints (different from above),
// keep this but give it a DIFFERENT base path to avoid collision, e.g.:
// app.use("/api/lab-tests-meta", require("./routes/LabTests/labTestRoutes"));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/centers", require("./routes/centers.routes"));
app.use("/api/center-services", require("./routes/centerService.routes"));

app.use('/api/events', require('./routes/freeEventsRoutes/eventRoutes'));
app.use('/api/event-registrations', require('./routes/freeEventsRoutes/eventRegistrationRoutes'));
app.use('/api/lab-tests', require('./routes/freeEventsRoutes/labTestResultRoutes'));
app.use('/api/eventLabNotifications', require('./routes/freeEventsRoutes/eventLabNotificationRoutes'));

// --- 404 for unknown API routes ---
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Not Found' });
  }
  return next();
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  const status = err.status || 400;
  const message = err.message || 'Request error';
  return res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server on http://${HOST}:${PORT}`);
});

module.exports = app;
