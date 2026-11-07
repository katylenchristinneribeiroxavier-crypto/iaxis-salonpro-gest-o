import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const refreshSalonReminders = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ salonId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const allowed = await context.supabase.rpc('manages_salon', { _salon: data.salonId });
    if (allowed.error || !allowed.data) throw new Error('Sem acesso aos lembretes deste salão');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const result = await db.rpc('prepare_salon_reminders', { _salon: data.salonId });
    if (result.error) throw new Error('Não foi possível preparar os lembretes');
    const evolving = await db.rpc('prepare_evolving_messages', { _salon: data.salonId });
    if (evolving.error) throw new Error('Não foi possível preparar mensagens inteligentes');
    return { count: result.data };
  });

export const getReminderControl = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'super_admin' });
    if (role.error || !role.data) throw new Error('Acesso exclusivo da desenvolvedora');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const result = await db.from('platform_reminder_control').select('enabled,updated_at').eq('id', true).maybeSingle();
    if (result.error) throw new Error('Não foi possível consultar a ativação');
    return { enabled: result.data?.enabled ?? false, schedulerReady: Boolean(process.env['LOVABLE_CRON_SECRET']) };
  });

export const setReminderControl = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'super_admin' });
    if (role.error || !role.data) throw new Error('Acesso exclusivo da desenvolvedora');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    if (data.enabled) {
      const platform = await db.from('platform_evolution_settings').select('enabled,verified_at,callback_origin').eq('id', true).maybeSingle();
      if (platform.error || !platform.data?.enabled || !platform.data.verified_at || !platform.data.callback_origin || !process.env['LOVABLE_CRON_SECRET']) throw new Error('Publique o app, valide a Evolution e configure a execução programada antes de ativar.');
    }
    const saved = await db.from('platform_reminder_control').upsert({ id: true, enabled: data.enabled, updated_by: context.userId, updated_at: new Date().toISOString() });
    if (saved.error) throw new Error('Não foi possível alterar a ativação');
    const audit = await db.from('platform_automation_audit').insert({ performed_by: context.userId, action: data.enabled ? 'Envio de lembretes habilitado pela desenvolvedora' : 'Envio de lembretes pausado pela desenvolvedora' });
    if (audit.error) throw new Error('Ativação salva; histórico indisponível');
    return { enabled: data.enabled };
  });