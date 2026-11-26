import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { setAuthToken, setUnauthorizedHandler } from '@/api';

// The logged-in user, as POST /auth/login returns it
export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean; // true while reading the saved login at startup
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

// Names of the entries in secure storage
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const AuthContext = createContext<AuthContextValue | null>(null);

// Wrap the app in this so every screen can call useAuth()
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // When the app starts, read the login saved last time (if any)
  useEffect(() => {
    async function loadSavedLogin() {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        if (savedToken && savedUser) {
          setAuthToken(savedToken); // apiRequest sends it from now on
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // Unreadable or damaged data: treat it as logged out
      } finally {
        setLoading(false);
      }
    }
    loadSavedLogin();
  }, []);

  // If the server ever rejects the token (401), log out and go to Login
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await logout();
      router.replace('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(newToken: string, newUser: User) {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    setAuthToken(null); // stop sending the token right away
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Any screen: const { user, login, logout } = useAuth();
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
