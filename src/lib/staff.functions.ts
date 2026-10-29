import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const inviteStaff = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ salonId:z.string().uuid(), professionalId:z.string().uuid(), email:z.string().email(), access:z.enum(['ADMIN','PROFISSIONAL']) })).handler(async({data,context})=>{
  const allowed = await context.supabase.rpc('manages_salon',{_salon:data.salonId});
  if(allowed.error || !allowed.data) throw new Error('Acesso restrito');
  const professional=await context.supabase.from('professionals').select('id').eq('id',data.professionalId).eq('salon_id',data.salonId).maybeSingle();
  if(!professional.data) throw new Error('Profissional não pertence ao salão');
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const invitation=await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
  if(invitation.error || !invitation.data.user) throw new Error('Não foi possível enviar o convite. Verifique se o e-mail já tem uma conta.');
  const member=await supabaseAdmin.from('salon_members').insert({salon_id:data.salonId,user_id:invitation.data.user.id,professional_id:data.professionalId,email:data.email,access:data.access});
  if(member.error) throw new Error('Convite enviado, mas o vínculo não foi salvo. Entre em contato com o suporte.');
  return {ok:true};
});