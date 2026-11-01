import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; bio?: string; originPlaces?: string[] }) => Promise<void>;
  resetPassword: (email: string, newPass: string) => Promise<void>;
  updateProfile: (data: { name?: string; bio?: string; originPlaces?: string[]; avatarUrl?: string }) => Promise<void>;
  switchDemoUser: (email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rootsconnect_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (token) {
        const profile = await api.getMe();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid token');
      localStorage.removeItem('rootsconnect_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no token exists, automatically login as Eleanor Vance by default for seamless instant demo!
    const initAuth = async () => {
      const savedToken = localStorage.getItem('rootsconnect_token');
      if (savedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('rootsconnect_token');
        }
      }

      // Default quick demo login
      try {
        const res = await api.switchDemo('eleanor@rootsconnect.local');
        localStorage.setItem('rootsconnect_token', res.token);
        setToken(res.token);
        setUser(res.user);
      } catch (e) {
        console.warn('Initial demo auto-login skipped');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('rootsconnect_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; name: string; bio?: string; originPlaces?: string[] }) => {
    const res = await api.register(data);
    localStorage.setItem('rootsconnect_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const resetPassword = async (email: string, newPass: string) => {
    const res = await api.resetPassword(email, newPass);
    localStorage.setItem('rootsconnect_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const updateProfile = async (data: { name?: string; bio?: string; originPlaces?: string[]; avatarUrl?: string }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  };

  const switchDemoUser = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.switchDemo(email);
      localStorage.setItem('rootsconnect_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rootsconnect_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, resetPassword, updateProfile, switchDemoUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
