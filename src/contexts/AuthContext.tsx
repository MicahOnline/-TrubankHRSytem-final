import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../../types';
import * as api from '../utils/api';
import { clearChatHistory } from '../../services/geminiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrPhone: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload. In a real app, use a library like `jwt-decode`.
const decodeJwt = (token: string): { userId: number } | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        // The user ID is expected in the 'sub' (subject) claim, a standard JWT practice.
        return { userId: decoded.sub };
    } catch (e) {
        console.error("Invalid JWT token:", e);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = sessionStorage.getItem('jwt');
        if (token) {
          const payload = decodeJwt(token);
          if (payload?.userId) {
            const userData = await api.getUser(payload.userId);
            setUser(userData);
          } else {
            // Malformed token
            sessionStorage.removeItem('jwt');
          }
        }
      } catch (error) {
        console.error("Failed to restore session", error);
        sessionStorage.removeItem('jwt'); // Token is likely invalid or expired
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const login = async (emailOrPhone: string, password?: string) => {
    setLoading(true);
    try {
      if (password !== undefined) {
        // Standard login with JWT
        const { user: userData, token } = await api.authenticateUser(emailOrPhone, password);
        setUser(userData);
        sessionStorage.setItem('jwt', token);
      } else {
        // Refresh user data using user ID (called from ProfileSettings)
        const token = sessionStorage.getItem('jwt');
        if (!token) throw new Error("No session found to refresh.");
        
        const userId = parseInt(emailOrPhone, 10);
        if (isNaN(userId)) {
          throw new Error("Invalid user ID for refresh.");
        }
        
        // Security check: ensure the requested ID matches the token's subject
        const payload = decodeJwt(token);
        if (!payload || payload.userId !== userId) {
            throw new Error("Session mismatch. Please log in again.");
        }
        
        const refreshedUserData = await api.getUser(userId);
        setUser(refreshedUserData);
      }
    } catch (error) {
        console.error("Login/Refresh failed", error);
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('jwt');
    clearChatHistory(); // Important for privacy
    // A full redirect is a clean way to reset all application state
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};