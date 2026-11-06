import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const verificarLicenca = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const result = await context.supabase.rpc('verificar_licenca');
  if (result.error) throw new Error('Não foi possível verificar a licença.');
  return result.data as { permitido: boolean; master?: boolean; sem_salao?: boolean; licenca?: { salao_id: string; aceitou_termos: boolean; data_expira: string; tipo_plano: string; status: string } };
});

export const gerenciarLicenca = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ email: z.string().trim().email().max(254), acao: z.enum(['mensal', 'anual', 'bloquear']) }).parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'super_admin' });
    if (role.error || !role.data) throw new Error('Acesso exclusivo da desenvolvedora.');
    const result = await context.supabase.rpc('master_licenca', { _email: data.email, _acao: data.acao });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });

export const aceitarTermosLicenca = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ salon: z.string().uuid(), aceitou: z.literal(true) }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc('aceitar_termos_licenca', { _salon: data.salon });
    if (result.error) throw new Error('Não foi possível registrar o aceite.');
    return { salvo: true };
  });