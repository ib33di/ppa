import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Court } from '../types';

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCourts(data as Court[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCourts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourts(data as Court[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { courts, loading, error, refetch: fetchCourts, refetchAll: fetchAllCourts };
}

