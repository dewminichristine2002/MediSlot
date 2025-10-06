import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// 🌿 Main Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import FreeEventsPage from "./pages/FreeEventsPage";
import GuidelinesPage from "./pages/GuidelinesPage";
import BookingPage from "./pages/BookingPage";
import CentersPage from "./pages/CentersPage";
import LabTestsPage from "./pages/LabTestsPage";

// 🌿 Health Center Pages
import HealthCenterHome from "./pages/HealthCenterHome";
import HealthCenterBookings from "./pages/HealthCenterBookings";
import HealthCenterDetails from "./pages/HealthCenterDetails";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Routes (Protected) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/free-events"
            element={
              <ProtectedRoute>
                <FreeEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guidelines"
            element={
              <ProtectedRoute>
                <GuidelinesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/centers"
            element={
              <ProtectedRoute>
                <CentersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/labtests"
            element={
              <ProtectedRoute>
                <LabTestsPage />
              </ProtectedRoute>
            }
          />

          {/* Health Center Routes (Protected) */}
          <Route
            path="/healthcenter/home"
            element={
              <ProtectedRoute>
                <HealthCenterHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/healthcenter/bookings"
            element={
              <ProtectedRoute>
                <HealthCenterBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/healthcenter/details"
            element={
              <ProtectedRoute>
                <HealthCenterDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
