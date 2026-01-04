import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Court } from '../types';

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Wait for Supabase session before fetching
    const initializeAndFetch = async () => {
      try {
        // Ensure we have a session - wait up to 2 seconds for auth to complete
        let session = null;
        for (let i = 0; i < 4; i++) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            session = currentSession;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (!session) {
          console.warn('No Supabase session found after waiting, fetching anyway (RLS policies should allow)');
        }
        
        await fetchCourts();
      } catch (err) {
        console.error('Error initializing courts:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    initializeAndFetch();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Supabase error fetching courts:', error);
        throw error;
      }
      setCourts(data as Court[]);
    } catch (err) {
      console.error('Error fetching courts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCourts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error fetching all courts:', error);
        throw error;
      }
      setCourts(data as Court[]);
    } catch (err) {
      console.error('Error fetching all courts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { courts, loading, error, refetch: fetchCourts, refetchAll: fetchAllCourts };
}

