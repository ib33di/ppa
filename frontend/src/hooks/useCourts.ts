import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Court } from '../types';
import { api } from '../lib/api';

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        await fetchCourts();

        // Realtime: courts + availability ranges
        const courtsSubscription = supabase
          .channel('courts-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'courts' },
            () => fetchCourts()
          )
          .subscribe();

        const availabilitySubscription = supabase
          .channel('court-availability-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'court_availability' },
            () => fetchCourts()
          )
          .subscribe();

        return () => {
          courtsSubscription.unsubscribe();
          availabilitySubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing courts:', err);
        setError(err as Error);
        setLoading(false);
        return () => {};
      }
    };

    let subscriptionCleanup: (() => void) | undefined;
    initializeAndFetch().then((cleanup) => {
      subscriptionCleanup = cleanup;
    });

    return () => {
      if (subscriptionCleanup) subscriptionCleanup();
    };
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Court[]>('/courts');
      setCourts(data);
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
      const data = await api.get<Court[]>('/courts?all=true');
      setCourts(data);
    } catch (err) {
      console.error('Error fetching all courts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { courts, loading, error, refetch: fetchCourts, refetchAll: fetchAllCourts };
}

