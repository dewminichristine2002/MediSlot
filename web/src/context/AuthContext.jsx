// context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { api } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const res = await api.post("/users/auth/login", { email, password });
    setUser(res.data.user);
    localStorage.setItem("token", res.data.token);
    return res.data.user; // ✅ So we can redirect based on role
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
