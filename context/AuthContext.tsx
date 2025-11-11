import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { fetchUserRecord, signInWithEmailAndPasswordFromFirebase, signOutFromFirebase } from '@/lib/firebase';

export type UserRole = 'teacher' | 'student';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
};

type LoginPayload = {
  email: string;
  password: string;
};

type FirebaseUserLike = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  login: (payload: LoginPayload) => Promise<UserRole>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const login = useCallback(async ({ email, password }: LoginPayload) => {
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail) {
      throw new Error('Enter your email address to continue.');
    }

    if (!password) {
      throw new Error('Enter your password to continue.');
    }

    const credential = await signInWithEmailAndPasswordFromFirebase(sanitizedEmail, password);
    const firebaseUser = (credential as { user?: FirebaseUserLike | null } | null)?.user ?? null;

    if (!firebaseUser) {
      throw new Error('The Firebase user record could not be loaded.');
    }

    const profile = await fetchUserRecord(firebaseUser.uid);
    if (!profile) {
      throw new Error('No user profile was found for this account.');
    }

    const role = profile.role;
    if (role !== 'teacher' && role !== 'student') {
      throw new Error('This account does not have a valid role.');
    }

    const displayName =
      profile.displayName ??
      firebaseUser.displayName ??
      firebaseUser.email ??
      sanitizedEmail;

    const authenticatedUser: AuthenticatedUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? sanitizedEmail,
      name: displayName,
      role,
    };

    setUser(authenticatedUser);

    return authenticatedUser.role;
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
