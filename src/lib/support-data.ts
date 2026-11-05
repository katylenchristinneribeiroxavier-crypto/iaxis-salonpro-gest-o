import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const supportTicketsOptions = (master = false) => queryOptions({
  queryKey: ['support-tickets', master],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Entre na sua conta');
    let query = supabase.from('tickets_suporte').select('*').order('created_at', { ascending: false });
    if (!master) query = query.eq('user_id', user.id);
    const result = await query;
    if (result.error) throw result.error;
    return result.data;
  },
});

export const supportStatusLabels: Record<string, string> = {
  aberto: 'Aberto', em_atendimento: 'Em atendimento', resolvido: 'Resolvido',
};