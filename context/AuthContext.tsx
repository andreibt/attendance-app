import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { signOutFromFirebase } from '@/lib/firebase';

export type UserRole = 'teacher' | 'student';

export type AuthenticatedUser = {
  name: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  login: (name: string, role: UserRole) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const login = useCallback((name: string, role: UserRole) => {
    setUser({ name, role });
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutFromFirebase();
    } catch (error) {
      console.warn('Failed to sign out from Firebase', error);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
