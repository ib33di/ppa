import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player } from '../types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
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
              fetchPlayers();
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
      if (subscriptionCleanup) {
        subscriptionCleanup();
      }
    };
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('trust_score', { ascending: false });

      if (error) {
        console.error('Supabase error fetching players:', error);
        throw error;
      }
      setPlayers(data as Player[]);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { players, loading, error, refetch: fetchPlayers };
}

