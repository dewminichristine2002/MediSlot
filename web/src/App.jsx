// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import FreeEventsPage from "./pages/FreeEventsPage";
import GuidelinesPage from "./pages/GuidelinesPage";
import CentersPage from "./pages/CentersPage";
import GuidelineForm from "./pages/GuidelineForm";
import GuidelineDetails from "./pages/GuidelineDetails";
import HealthAwarenessAdmin from "./pages/HealthAwarenessAdmin";


// Health center (use nested routes)
import HCMeRouter from "./pages/HCMeRouter";
import HCLayout from "./pages/HCLayout";

// Reuse your existing pages as children
import HealthCenterHome from "./pages/HealthCenterHome";
import HealthCenterBookings from "./pages/HealthCenterBookings";
import HealthCenterDetails from "./pages/HealthCenterDetails";
import TestsList from "./components/TestsList";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin-only app (protected) */}
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
            path="/guidelines/:id"
            element={
              <ProtectedRoute>
                <GuidelineDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guideline-form"
            element={
              <ProtectedRoute>
                <GuidelineForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guideline-form/:id"
            element={
              <ProtectedRoute>
                <GuidelineForm />
              </ProtectedRoute>
            }
          />
           <Route path="/admin/health-awareness" element={ <ProtectedRoute><HealthAwarenessAdmin /></ProtectedRoute>} />


          <Route
            path="/centers"
            element={
              <ProtectedRoute>
                <CentersPage />
              </ProtectedRoute>
            }
          />

          {/* --- Health center space --- */}

          {/* Backward-compat: old URL -> "me" */}
          <Route
            path="/healthcenter/home"
            element={<Navigate to="/healthcenter/me" replace />}
          />

          {/* Resolve my center via /api/centers/me then redirect to /healthcenter/:centerId/home */}
          <Route
            path="/healthcenter/me"
            element={
              <ProtectedRoute>
                <HCMeRouter />
              </ProtectedRoute>
            }
          />

          {/* Nested per-center routes */}
          <Route
            path="/healthcenter/:centerId"
            element={
              <ProtectedRoute>
                <HCLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HealthCenterHome />} />
            <Route path="bookings" element={<HealthCenterBookings />} />
            <Route path="tests" element={<TestsList />} />
            <Route path="details" element={<HealthCenterDetails />} />

            
          </Route>

          {/* Default fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
