import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';

export function useReviews(limit = 10, approvedOnly = true) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (approvedOnly) query = query.eq('approved', true);

    query
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) setError(error.message);
          else setReviews(data || []);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [limit, approvedOnly]);

  return { reviews, loading, error };
}
