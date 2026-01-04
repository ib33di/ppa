import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserWithRole extends User {
  role?: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token with backend
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Invalid token');
        })
        .then(userData => {
          // Create a user object from backend response
          const userRole = userData.role || 'user';
          console.log('User profile loaded:', { email: userData.email, role: userRole });
          setUser({
            id: userData.id,
            email: userData.email,
            role: userRole,
          } as UserWithRole);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          setToken(null);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    // Also listen to Supabase auth for Realtime
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Get JWT from backend
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const result = await response.json();
    setToken(result.access_token);
    localStorage.setItem('access_token', result.access_token);
    
    // Update user state
    const userRole = result.user.role || 'user';
    console.log('User logged in:', { email: result.user.email, role: userRole });
    setUser({
      id: result.user.id,
      email: result.user.email,
      role: userRole,
    } as UserWithRole);
    
    // Also sign in to Supabase for Realtime subscriptions
    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (supabaseError) {
      console.warn('Supabase auth error:', supabaseError);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Register via backend
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    const result = await response.json();
    setToken(result.access_token);
    localStorage.setItem('access_token', result.access_token);
    
    // Update user state
    const userRole = result.user.role || 'user';
    console.log('User registered:', { email: result.user.email, role: userRole });
    setUser({
      id: result.user.id,
      email: result.user.email,
      role: userRole,
    } as UserWithRole);
    
    // Also sign up to Supabase for Realtime subscriptions
    const { error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'user',
        },
      },
    });

    if (supabaseError) {
      console.warn('Supabase auth error:', supabaseError);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, token, isAdmin, isManager }}>
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

