import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface FetchHourlyTrendsArgs {
  p_start: string;
  p_end: string;
  p_store: number[];
}

export const useFetchHourlyTrends = (args: FetchHourlyTrendsArgs) => {
  return useQuery({
    queryKey: ['get_hourly_trends', args],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_hourly_trends', args);
      if (error) throw error;
      return data;
    },
  });
};