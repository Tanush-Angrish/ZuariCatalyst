import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On every page load, ask the server to verify the httpOnly cookie and return the user.
    api.getMe()
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const msLogin = async (idToken) => {
    try {
      const data = await api.msLogin({ idToken });
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('MS Login Error:', error);
      throw error;
    }
  };

  const googleLogin = async (access_token) => {
    try {
      const data = await api.googleLogin({ access_token });
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Even if the server call fails, clear client state so the UI resets
    } finally {
      setUser(null);
    }
  };

  /**
   * Switches the user's active role (for multi-role users).
   * Calls the backend to update the active role, then re-fetches /me
   * to get a fresh JWT with the new active role baked in.
   */
  const switchRole = async (newRole) => {
    if (!user) return;
    try {
      await api.switchActiveRole(user.id, newRole);
      // Re-fetch fresh user from /me (backend re-issues cookie with new role)
      const data = await api.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Role switch error:', error);
      throw error;
    }
  };

  /**
   * Refresh user profile — call after uploading a new profile photo.
   */
  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Refresh user error:', error);
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
    <AuthContext.Provider value={{ user, msLogin, googleLogin, logout, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
