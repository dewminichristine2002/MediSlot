// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

// CORS once
app.use(cors({ origin: true, credentials: true }));

// JSON body parser
app.use(express.json());

// Ensure uploads directories exist
const uploadsRoot = path.join(__dirname, 'uploads');
const reportsDir = path.join(uploadsRoot, 'reports');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

// Serve static files
app.use('/uploads', express.static(uploadsRoot));

// Health first (works even if DB fails)
app.get('/', (_req, res) => res.send('OK'));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Try DB, but don't exit in dev
(async () => {
  try {
    await connectDB();
    console.log('Mongo connected');
  } catch (e) {
    console.error('Mongo connect failed:', e.message);
  }
})();

// Routes
app.use('/api/events', require('./routes/freeEventsRoutes/eventRoutes'));
app.use('/api/event-registrations', require('./routes/freeEventsRoutes/eventRegistrationRoutes'));
app.use('/api/lab-tests', require('./routes/freeEventsRoutes/labTestResultRoutes'));
app.use('/api/eventLabNotifications', require('./routes/freeEventsRoutes/eventLabNotificationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Error handler for multer/fileFilter, etc.
app.use((err, _req, res, _next) => {
  if (err) {
    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Upload error' });
  }
});

const PORT = process.env.PORT || 5000;
// Bind to 0.0.0.0 so other devices can reach it (e.g., Expo)
app.listen(PORT, '0.0.0.0', () => console.log(`Server on http://0.0.0.0:${PORT}`));

module.exports = app;
