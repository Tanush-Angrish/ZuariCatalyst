import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session on load
    const storedUser = localStorage.getItem('demo_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      setUser(data.user);
      localStorage.setItem('demo_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  };

  // msLogin removed — MSAL/Outlook SSO is disabled
  // const msLogin = async (idToken) => { ... };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('demo_user');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
