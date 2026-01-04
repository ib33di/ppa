import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match } from '../types';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
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
        
        await fetchMatches();

        // Subscribe to real-time updates
        const subscription = supabase
          .channel('matches-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
            },
            () => {
              fetchMatches();
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
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
      if (subscriptionCleanup) {
        subscriptionCleanup();
      }
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          court:courts(*),
          invitations(
            *,
            player:players(*)
          )
        `)
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('Supabase error fetching matches:', error);
        throw error;
      }
      setMatches(data as Match[]);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { matches, loading, error, refetch: fetchMatches };
}

