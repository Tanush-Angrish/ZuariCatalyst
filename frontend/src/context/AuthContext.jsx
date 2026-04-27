import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On every page load, ask the server to verify the httpOnly cookie and return the user.
    // If the cookie is missing or expired, /api/auth/me returns 401 and we stay logged out.
    // This replaces the insecure localStorage approach.
    api.getMe()
      .then(data => setUser(data.user))
      .catch(() => setUser(null))   // 401 = not logged in, clear state silently
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      // Server sets the httpOnly auth_token cookie and returns the user object
      const data = await api.login({ email, password });
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  };

  const msLogin = async (idToken) => {
    try {
      // Server verifies Azure token, sets httpOnly auth_token cookie, returns user
      const data = await api.msLogin({ idToken });
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('MS Login Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Ask the server to clear the httpOnly cookie (JS cannot clear it directly)
      await api.logout();
    } catch {
      // Even if the server call fails, clear client state so the UI resets
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, msLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
