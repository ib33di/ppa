import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Match } from '../types';
import { api } from '../lib/api';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  // "loading" here represents the initial load only to avoid UI flicker.
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
        await fetchMatches();

        // Subscribe to real-time updates for matches
        const matchesSubscription = supabase
          .channel('matches-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
            },
            () => scheduleFetch()
          )
          .subscribe();

        // Subscribe to real-time updates for invitations
        const invitationsSubscription = supabase
          .channel('invitations-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'invitations',
            },
            () => scheduleFetch()
          )
          .subscribe();

        return () => {
          matchesSubscription.unsubscribe();
          invitationsSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing matches:', err);
        setError(err as Error);
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    let subscriptionCleanup: (() => void) | undefined;
    initializeAndFetch().then(cleanup => {
      subscriptionCleanup = cleanup;
    });

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (subscriptionCleanup) {
        subscriptionCleanup();
      }
    };
  }, []);

  const scheduleFetch = () => {
    // Batch bursts of realtime events into a single fetch.
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      fetchMatches();
    }, 200);
  };

  const fetchMatches = async () => {
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);
      const data = await api.get<Match[]>('/matches');
      // Ignore stale responses (avoid race conditions).
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setMatches(data);
        hasLoadedRef.current = true;
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      if (isMountedRef.current) setError(err as Error);
    } finally {
      if (isMountedRef.current && !hasLoadedRef.current) setLoading(false);
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        fetchMatches();
      }
    }
  };

  return { matches, loading, error, refetch: fetchMatches };
}

