
// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Import your route modules (CommonJS style)
const healthAwarenessRoutes = require("./routes/LabTests/healthAwarenessRoutes");
const testRoutes = require("./routes/LabTests/labTestRoutes");
const userChecklistRoutes = require("./routes/LabTests/userChecklistRoutes");

dotenv.config();

const app = express();

// CORS (once)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check endpoints
app.get("/", (_req, res) => res.send("OK"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directories exist (recursive)
const uploadsRoot = path.join(__dirname, 'uploads');
const reportsDir = path.join(uploadsRoot, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

// Serve static files (e.g., /uploads/reports/<file>)
app.use('/uploads', express.static(uploadsRoot));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health first (works even if DB fails)
app.get('/', (_req, res) => res.send('OK'));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Try DB, but don't exit in dev
(async () => {
  try {
    await connectDB();
    console.log('Mongo connected');
  } catch (e) {
    console.error("Mongo connect failed:", e.message);
  }
})();

// Only mount the routes you actually have
app.use("/api/health-awareness", healthAwarenessRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/user-checklists", userChecklistRoutes);

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/centers", require("./routes/centers.routes"));
app.use("/api/tests", require("./routes/tests.routes"));
app.use("/api/center-services", require("./routes/centerService.routes"));

// Routes
app.use('/api/events', require('./routes/freeEventsRoutes/eventRoutes'));
app.use('/api/event-registrations', require('./routes/freeEventsRoutes/eventRegistrationRoutes'));
app.use('/api/lab-tests', require('./routes/freeEventsRoutes/labTestResultRoutes'));
app.use('/api/eventLabNotifications', require('./routes/freeEventsRoutes/eventLabNotificationRoutes'));


// 404 for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Not Found' });
  }
  return next();
});

// Error handler (multer/fileFilter, JSON errors, etc.)
app.use((err, _req, res, _next) => {
  const status = err.status || 400;
  const message = err.message || 'Request error';
  return res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // bind so Expo devices can reach it
app.listen(PORT, HOST, () => {
  console.log(`Server on http://${HOST}:${PORT}`);
});

module.exports = app;
