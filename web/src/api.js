import axios from "axios";

// ✅ Use .env variable or fallback to localhost for dev
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ✅ Create a configured Axios instance
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Automatically attach JWT token (if available)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Optional: global error interceptor for better debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error(`❌ API Error [${status || "No Status"}]:`, message);

    // Optional auto logout if token expired
    if (status === 401) {
      localStorage.removeItem("token");
      console.warn("⚠️ Token expired or unauthorized — logging out.");
    }

    return Promise.reject(error);
  }
);

export default api;
