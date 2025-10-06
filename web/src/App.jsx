import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import FreeEventsPage from "./pages/FreeEventsPage";
import GuidelinesPage from "./pages/GuidelinesPage";
import BookingPage from "./pages/BookingPage";
import CentersPage from "./pages/CentersPage";
import LabTestsPage from "./pages/LabTestsPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
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
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
