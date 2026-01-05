import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Player } from '../types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
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
        
        await fetchPlayers();

        // Subscribe to real-time updates
        const subscription = supabase
          .channel('players-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'players',
            },
            () => {
              scheduleFetch();
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing players:', err);
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
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      fetchPlayers();
    }, 200);
  };

  const fetchPlayers = async () => {
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('trust_score', { ascending: false });

      if (error) {
        console.error('Supabase error fetching players:', error);
        throw error;
      }
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setPlayers(data as Player[]);
        hasLoadedRef.current = true;
      }
    } catch (err) {
      console.error('Error fetching players:', err);
      if (isMountedRef.current) setError(err as Error);
    } finally {
      if (isMountedRef.current && !hasLoadedRef.current) setLoading(false);
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        fetchPlayers();
      }
    }
  };

  return { players, loading, error, refetch: fetchPlayers };
}

