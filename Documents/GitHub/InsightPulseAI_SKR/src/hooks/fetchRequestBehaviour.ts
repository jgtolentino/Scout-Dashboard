import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface FetchRequestBehaviourArgs {
  p_start: string;
  p_end: string;
}

export const useFetchRequestBehaviour = (args: FetchRequestBehaviourArgs) => {
  return useQuery({
    queryKey: ['get_request_behaviour', args],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_request_behaviour', args);
      if (error) throw error;
      return data;
    },
  });
};