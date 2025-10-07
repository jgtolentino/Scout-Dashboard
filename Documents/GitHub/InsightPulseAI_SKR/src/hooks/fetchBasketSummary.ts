import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface FetchBasketSummaryArgs {
  p_cat: string;
  p_n: any;
}

export const useFetchBasketSummary = (args: FetchBasketSummaryArgs) => {
  return useQuery({
    queryKey: ['get_basket_summary', args],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_basket_summary', args);
      if (error) throw error;
      return data;
    },
  });
};