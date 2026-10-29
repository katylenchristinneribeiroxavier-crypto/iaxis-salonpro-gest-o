import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export const salonContextOptions = queryOptions({
  queryKey: ['salon-context'],
  queryFn: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Entre na sua conta');
    const [roles, own, membership] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id),
      supabase.from('salons').select('*').eq('owner_id', user.id).maybeSingle(),
      supabase.from('salon_members').select('*').eq('user_id', user.id).limit(1).maybeSingle(),
    ]);
    const admin = roles.data?.some(r => r.role === 'super_admin') ?? false;
    let salon = own.data;
    if (!salon && membership.data) {
      const response = await supabase.from('salons').select('*').eq('id', membership.data.salon_id).maybeSingle();
      salon = response.data;
    }
    if (!salon && admin) {
      const response = await supabase.from('salons').select('*').order('created_at').limit(1).maybeSingle();
      salon = response.data;
    }
    return { userId: user.id, admin, salon, member: membership.data, manager: admin || !!own.data || membership.data?.access === 'ADMIN' };
  },
});
export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} — IAxis SalonPRO` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} — IAxis SalonPRO` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}