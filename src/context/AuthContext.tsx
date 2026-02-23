'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '@/types';
import { getUser, setAuthData, clearAuthData, isAuthenticated } from '@/lib/auth';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: 'individual' | 'vendor' | 'coordinator';
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    if (isAuthenticated()) {
      const storedUser = getUser();
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    
    if (response.success && response.data) {
      const authData = response.data as AuthResponse;
      setAuthData(authData);
      setUser(authData.user);
      return { success: true, role: authData.user.role };
    }
    
    return { success: false, error: response.error || 'Login failed' };
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role: 'individual' | 'vendor' | 'coordinator';
    phone?: string;
  }) => {
    const response = await authApi.register(data);
    
    if (response.success && response.data) {
      const authData = response.data as AuthResponse;
      setAuthData(authData);
      setUser(authData.user);
      return { success: true };
    }
    
    return { success: false, error: response.error || 'Registration failed' };
  };

  const logout = () => {
    authApi.logout();
    clearAuthData();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
