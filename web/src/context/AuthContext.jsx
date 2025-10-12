// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Restore user session on refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  // ✅ Login function
  const login = async (email, password) => {
    const res = await api.post("/users/auth/login", { email, password });
    const { user, token } = res.data;

    // Save token + user
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // Add token to axios header
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(user);
    return user; // so caller can redirect based on role
  };

  // ✅ Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
