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

app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/event-patients', require('./routes/eventPatientRoutes'));
app.use('/api/event-registrations', require('./routes/eventRegistrationRoutes'));
app.use('/api/lab-tests', require('./routes/labTestResultRoutes'));
app.use('/api/eventLabNotifications', require('./routes/eventLabNotificationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));




// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export app for testing
module.exports = app;