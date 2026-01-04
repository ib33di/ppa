import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Function to load user profile with role
    const loadUserProfile = async (userId: string, email: string) => {
      try {
        // First try to get role from backend
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
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

    // Check for stored token
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      
      // Get session from Supabase first to get userId
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const userWithRole = await loadUserProfile(session.user.id, session.user.email || '');
          setUser(userWithRole);
          setLoading(false);
        } else {
          // No Supabase session, try backend only
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
            .then(async userData => {
              let userRole = userData.role || 'user';
              if (userRole === 'authenticated') {
                userRole = 'user';
              }
              console.log('User profile loaded (backend only):', { email: userData.email, role: userRole, rawRole: userData.role });
              
              // Try to get updated role from Supabase if we have userId
              if (userData.id) {
                const userWithRole = await loadUserProfile(userData.id, userData.email || '');
                setUser(userWithRole);
              } else {
                setUser({
                  id: userData.id,
                  email: userData.email,
                  role: userRole,
                } as UserWithRole);
              }
              setLoading(false);
            })
            .catch(() => {
              localStorage.removeItem('access_token');
              setToken(null);
              setUser(null);
              setLoading(false);
            });
        }
      });
    } else {
      setLoading(false);
    }

    // Listen to Supabase auth changes and update role
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userWithRole = await loadUserProfile(session.user.id, session.user.email || '');
        setUser(userWithRole);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('access_token');
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

