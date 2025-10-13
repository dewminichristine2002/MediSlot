// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { meApi } from '../api/auth';

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const { data } = await meApi();

          // 🧩 Normalize: ensure _id is always present
          const normalizedUser = data
            ? { ...data, _id: data._id || data.id }
            : null;

          setUser(normalizedUser);
        }
      } catch (err) {
        console.error('❌ Failed to load user from /me:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async ({ token, user }) => {
    await AsyncStorage.setItem('token', token);
    // ensure _id exists here too
    const normalizedUser = user ? { ...user, _id: user._id || user.id } : null;
    setUser(normalizedUser);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
