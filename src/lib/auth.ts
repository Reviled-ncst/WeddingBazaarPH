import { User, AuthResponse } from '@/types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Store auth data
export function setAuthData(data: AuthResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

// Get stored token
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Get stored user
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

// Clear auth data
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Check if user is vendor
export function isVendor(): boolean {
  const user = getUser();
  return user?.role === 'vendor';
}

// Check if user is admin
export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'admin';
}
