import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '../services/auth.service';
import { getToken } from '../api/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleToken: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Check if we have a stored token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const res = await authService.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        await authService.logout();
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    if (res.data?.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Error al iniciar sesión' };
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const res = await authService.register(email, password, displayName);
    if (res.data?.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Error al registrarse' };
  };

  const loginWithGoogleToken = async (idToken: string) => {
    const res = await authService.loginWithGoogleToken(idToken);
    if (res.data?.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Error al iniciar sesión con Google' };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoading,
      login, register, loginWithGoogleToken, logout, checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
