import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../../types';
import * as api from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // FIX: Updated login function signature to allow for refreshing user data.
  login: (emailOrPhone: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const userId = sessionStorage.getItem('userId');
        if (userId) {
          const userData = await api.getUser(parseInt(userId, 10));
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
        sessionStorage.removeItem('userId');
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // FIX: Updated login function to handle both authentication (with password)
  // and refreshing user data (with just user ID as string).
  const login = async (emailOrPhone: string, password?: string) => {
    setLoading(true);
    try {
      if (password !== undefined) {
        // Standard login with credentials
        const userData = await api.authenticateUser(emailOrPhone, password);
        setUser(userData);
        sessionStorage.setItem('userId', String(userData.id));
      } else {
        // Refresh user data using user ID
        const userId = parseInt(emailOrPhone, 10);
        if (isNaN(userId)) {
          throw new Error("Invalid user ID for refresh.");
        }
        const refreshedUserData = await api.getUser(userId);
        setUser(refreshedUserData);
      }
    } catch (error) {
        console.error("Login/Refresh failed", error);
        // Re-throw the error so the calling component can catch it
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('userId');
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