import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface FetchConsumerProfileArgs {
  p_start: string;
  p_end: string;
}

export const useFetchConsumerProfile = (args: FetchConsumerProfileArgs) => {
  return useQuery({
    queryKey: ['get_consumer_profile', args],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_consumer_profile', args);
      if (error) throw error;
      return data;
    },
  });
};