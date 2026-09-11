import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { authApi } from '../api';
import type { User, UserProfile, UpdateProfileData } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (tenantName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode basic JWT payload without external library
function parseJwtPayload(token: string): { userId: string; tenantId: string; role: 'owner' | 'admin' | 'agent' | 'viewer'; email?: string } | null {
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

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await authApi.getMe();
      if (profile) {
        setUser(profile);
      }
    } catch (err) {
      console.debug('[AuthContext] Failed to load full profile:', err);
    }
  }, []);

  // Initialize user from saved token
  useEffect(() => {
    const initAuth = async () => {
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

          // Fetch full detailed profile from backend
          try {
            const profile = await authApi.getMe();
            if (profile) {
              setUser(profile);
            }
          } catch (err) {
            console.debug('[AuthContext] Initial profile sync failed:', err);
          }
        } else {
          localStorage.removeItem('auth_token');
          apiClient.setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

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

      const baseUser: User = {
        id: response.userId,
        tenantId: response.tenantId,
        email: response.email || email,
        role: (response.role as any) || payload?.role || 'owner',
      };

      setUser(baseUser);
      setTokenState(response.token);
      apiClient.setToken(response.token);

      // Attempt to load full profile immediately
      try {
        const fullProfile = await authApi.getMe();
        if (fullProfile) {
          setUser(fullProfile);
        }
      } catch {
        // baseUser is already populated
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (tenantName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.signup({ tenantName, email, password });
      const payload = parseJwtPayload(response.token);

      const baseUser: User = {
        id: response.userId,
        tenantId: response.tenantId,
        email: response.email || email,
        tenantName,
        role: (response.role as any) || payload?.role || 'owner',
      };

      setUser(baseUser);
      setTokenState(response.token);
      apiClient.setToken(response.token);

      try {
        const fullProfile = await authApi.getMe();
        if (fullProfile) {
          setUser(fullProfile);
        }
      } catch {
        // baseUser is already set
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    return updated;
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
        refreshProfile: fetchProfile,
        updateProfile,
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
