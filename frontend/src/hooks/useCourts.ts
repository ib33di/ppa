import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Court } from '../types';
import { api } from '../lib/api';

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  // "loading" here represents initial load only to prevent UI flicker.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    const initializeAndFetch = async () => {
      try {
        await fetchCourts();

        // Realtime: courts + availability ranges
        const courtsSubscription = supabase
          .channel('courts-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'courts' },
            () => scheduleFetch()
          )
          .subscribe();

        const availabilitySubscription = supabase
          .channel('court-availability-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'court_availability' },
            () => scheduleFetch()
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
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (subscriptionCleanup) subscriptionCleanup();
    };
  }, []);

  const scheduleFetch = () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      fetchCourts();
    }, 200);
  };

  const fetchCourts = async () => {
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    const isInitialLoad = !hasLoadedRef.current;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);
      const data = await api.get<Court[]>('/courts');
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setCourts(data);
        hasLoadedRef.current = true;
        if (isInitialLoad) setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching courts:', err);
      if (isMountedRef.current) setError(err as Error);
    } finally {
      // Ensure the initial "Loading..." screen always unblocks after first attempt.
      if (isMountedRef.current && isInitialLoad) setLoading(false);
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        fetchCourts();
      }
    }
  };

  const fetchAllCourts = async () => {
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    const isInitialLoad = !hasLoadedRef.current;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);
      const data = await api.get<Court[]>('/courts?all=true');
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setCourts(data);
        hasLoadedRef.current = true;
        if (isInitialLoad) setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching all courts:', err);
      if (isMountedRef.current) setError(err as Error);
    } finally {
      // Ensure the initial "Loading..." screen always unblocks after first attempt.
      if (isMountedRef.current && isInitialLoad) setLoading(false);
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        fetchCourts();
      }
    }
  };

  return { courts, loading, error, refetch: fetchCourts, refetchAll: fetchAllCourts };
}

