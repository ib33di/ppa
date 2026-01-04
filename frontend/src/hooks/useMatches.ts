import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match } from '../types';
import { api } from '../lib/api';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
            () => {
              console.log('[Realtime] Match updated, refetching...');
              fetchMatches();
            }
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
            () => {
              console.log('[Realtime] Invitation updated, refetching matches...');
              fetchMatches();
            }
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
      if (subscriptionCleanup) {
        subscriptionCleanup();
      }
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Match[]>('/matches');
      setMatches(data);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { matches, loading, error, refetch: fetchMatches };
}

