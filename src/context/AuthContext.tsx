import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (tenantName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode basic JWT payload without external library
function parseJwtPayload(token: string): { userId: string; tenantId: string; role: 'owner' | 'admin' | 'agent'; email?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize user from saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      const payload = parseJwtPayload(savedToken);
      if (payload && payload.userId && payload.tenantId) {
        setUser({
          id: payload.userId,
          tenantId: payload.tenantId,
          email: payload.email || 'user@example.com',
          role: payload.role || 'owner',
        });
        setTokenState(savedToken);
        apiClient.setToken(savedToken);
      } else {
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
      }
    }
    setIsLoading(false);

    // Register 401 callback
    apiClient.setOnUnauthorized(() => {
      logout();
    });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const payload = parseJwtPayload(response.token);

      setUser({
        id: response.userId,
        tenantId: response.tenantId,
        email,
        role: payload?.role || 'owner',
      });
      setTokenState(response.token);
      apiClient.setToken(response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (tenantName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.signup({ tenantName, email, password });
      const payload = parseJwtPayload(response.token);

      setUser({
        id: response.userId,
        tenantId: response.tenantId,
        email,
        role: payload?.role || 'owner',
      });
      setTokenState(response.token);
      apiClient.setToken(response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    apiClient.setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenantId: user?.tenantId || null,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
