import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface FetchSubstitutionFlowArgs {

}

export const useFetchSubstitutionFlow = (args: FetchSubstitutionFlowArgs) => {
  return useQuery({
    queryKey: ['get_substitution_flow', args],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_substitution_flow', args);
      if (error) throw error;
      return data;
    },
  });
};