import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserResponse } from '../types';
import * as authApi from '../api/auth';

interface AuthContextValue {
  user: UserResponse | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'eventflow_token';
const USER_KEY = 'eventflow_user';

/**
 * Wraps the whole app (see main.tsx) so any component can call useAuth()
 * to find out who's logged in, or trigger login/logout, without prop
 * drilling. Token + user are persisted to localStorage so a page refresh
 * doesn't log you out — read back in as the initial state below.
 *
 * Note: storing a JWT in localStorage is simple and common for a project
 * like this, but it IS readable by any JS running on the page (i.e.
 * vulnerable to XSS). A production app handling real payments would
 * typically use an httpOnly cookie instead — worth a line in your README
 * as a known tradeoff.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserResponse | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  function persist(newToken: string, newUser: UserResponse) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      persist(res.token, res.user);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(email: string, password: string, fullName: string) {
    setIsLoading(true);
    try {
      const res = await authApi.register(email, password, fullName);
      persist(res.token, res.user);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
