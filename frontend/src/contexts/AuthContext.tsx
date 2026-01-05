import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { onUnauthorized } from '../lib/authEvents';

interface UserWithRole {
  id: string;
  email: string;
  role?: string;
  name?: string;
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

const DEFAULT_TIMEOUT_MS = 15000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const clearAuthState = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  };

  useEffect(() => {
    // Function to load user profile with role
    const loadUserProfile = async (userId: string, email: string) => {
      try {
        // First try to get role from backend
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          const response = await fetchWithTimeout(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            let userRole = userData.role || 'user';
            if (userRole === 'authenticated') {
              userRole = 'user';
            }
            console.log('User profile loaded from backend:', { email: userData.email, role: userRole, rawRole: userData.role });
            return {
              id: userData.id || userId,
              email: userData.email || email,
              role: userRole,
            } as UserWithRole;
          }
        }
        
        // Fallback: Try to get role from Supabase user_profiles table
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, name')
          .eq('id', userId)
          .single();
        
        if (profile && !error) {
          let userRole = profile.role || 'user';
          if (userRole === 'authenticated') {
            userRole = 'user';
          }
          console.log('User profile loaded from Supabase:', { email, role: userRole, rawRole: profile.role });
          return {
            id: userId,
            email: email,
            role: userRole,
          } as UserWithRole;
        }
        
        // Default fallback
        console.log('Using default role for user:', { email, userId });
        return {
          id: userId,
          email: email,
          role: 'user',
        } as UserWithRole;
      } catch (error) {
        console.error('Error loading user profile:', error);
        return {
          id: userId,
          email: email,
          role: 'user',
        } as UserWithRole;
      }
    };

    let isMounted = true;

    const initialize = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) setToken(storedToken);

      try {
        // Try Supabase session first (fast path)
        let sessionUser: { id: string; email?: string } | null = null;
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            sessionUser = { id: data.session.user.id, email: data.session.user.email || '' };
          }
        } catch (err) {
          console.warn('Supabase getSession failed:', err);
        }

        if (sessionUser) {
          // Unblock UI immediately; role can be resolved async.
          if (!isMounted) return;
          setUser({ id: sessionUser.id, email: sessionUser.email || '', role: 'user' });
          setLoading(false);

          loadUserProfile(sessionUser.id, sessionUser.email || '')
            .then((u) => {
              if (isMounted) setUser(u);
            })
            .catch(() => {
              // ignore; we already set a safe default
            });
          return;
        }

        // No Supabase session; use backend token if present
        if (storedToken) {
          try {
            const res = await fetchWithTimeout(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
              headers: { 'Authorization': `Bearer ${storedToken}` },
            });

            if (!res.ok) throw new Error('Invalid token');
            const userData = await res.json();
            let userRole = userData.role || 'user';
            if (userRole === 'authenticated') userRole = 'user';

            if (!isMounted) return;
            setUser({
              id: userData.id,
              email: userData.email,
              role: userRole,
            } as UserWithRole);
          } catch (err) {
            console.warn('Backend profile failed, clearing auth:', err);
            localStorage.removeItem('access_token');
            if (!isMounted) return;
            setToken(null);
            setUser(null);
          } finally {
            if (isMounted) setLoading(false);
          }
          return;
        }

        // No token at all
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    // Listen to Supabase auth changes and update role
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Unblock quickly, then resolve role async to avoid indefinite "loading"
        setUser({ id: session.user.id, email: session.user.email || '', role: 'user' });
        setLoading(false);
        loadUserProfile(session.user.id, session.user.email || '')
          .then((u) => setUser(u))
          .catch(() => {
            // ignore
          });
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('access_token');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
    
    // Update user state - use role from backend response
    let userRole = result.user.role || 'user';
    if (userRole === 'authenticated') {
      userRole = 'user';
    }
    console.log('User logged in:', { email: result.user.email, role: userRole, rawRole: result.user.role });
    
    const userWithRole: UserWithRole = {
      id: result.user.id,
      email: result.user.email,
      role: userRole,
    };
    setUser(userWithRole);
    
    // Also sign in to Supabase for Realtime subscriptions
    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (supabaseError) {
      console.warn('Supabase auth error:', supabaseError);
    } else {
      // After Supabase sign in, verify role from user_profiles table
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', result.user.id)
        .single();
      
      if (profile?.role && profile.role !== 'authenticated') {
        const verifiedRole = profile.role;
        console.log('Role verified from Supabase:', { email: result.user.email, role: verifiedRole });
        setUser({
          ...userWithRole,
          role: verifiedRole,
        });
      }
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
    // Filter out 'authenticated' as it's not a valid role
    let userRole = result.user.role || 'user';
    if (userRole === 'authenticated') {
      userRole = 'user';
    }
    console.log('User registered:', { email: result.user.email, role: userRole, rawRole: result.user.role });
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
    await clearAuthState();
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  useEffect(() => {
    // Ensure 401s never hard-navigate / reload the page.
    return onUnauthorized(() => {
      clearAuthState();
    });
  }, []);

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

