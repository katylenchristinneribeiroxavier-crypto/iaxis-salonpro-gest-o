import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { evolutionBaseUrl, evolutionPhone } from './evolution';

export const getEvolutionSettings = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await context.supabase.from('configuracoes_salao')
      .select('salon_id, evolution_api_url, evolution_instance, evolution_connection_state, evolution_webhook_enabled, evolution_last_received_at')
      .eq('user_id', context.userId).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });

export const saveEvolutionSettings = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().max(500), instance: z.string().trim().min(1).max(200), token: z.string().trim().max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const own = await context.supabase.from('salons').select('id').eq('owner_id', context.userId).single();
    if (own.error || !own.data) throw new Error('Cadastre seu salão antes de conectar.');
    const current = await context.supabase.from('configuracoes_salao').select('evolution_api_key').eq('user_id', context.userId).maybeSingle();
    if (current.error) throw new Error(current.error.message);
    const key = data.token || current.data?.evolution_api_key;
    if (!key) throw new Error('Informe a chave da Evolution.');
    const result = await context.supabase.from('configuracoes_salao').upsert({ user_id: context.userId, salon_id: own.data.id,
      evolution_api_url: evolutionBaseUrl(data.url), evolution_api_key: key, evolution_instance: data.instance,
      evolution_webhook_enabled: false, evolution_connection_state: '',
    }, { onConflict: 'user_id' });
    if (result.error) throw new Error(result.error.message);
    return { saved: true };
  });

export const connectEvolution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ callbackOrigin: z.string().url() }).parse(input))
  .handler(async ({ data, context }) => {
    const config = await context.supabase.from('configuracoes_salao').select('*').eq('user_id', context.userId).single();
    if (config.error || !config.data?.evolution_api_url || !config.data.evolution_api_key || !config.data.evolution_instance) throw new Error('Salve URL, instância e chave primeiro.');
    const c = config.data;
    if (!c.evolution_api_url || !c.evolution_api_key) throw new Error('Configuração incompleta.');
    const { evolutionRequest, tenantWebhookToken } = await import('./evolution.server');
    const state = await evolutionRequest(c.evolution_api_url, c.evolution_api_key, `/instance/connectionState/${encodeURIComponent(c.evolution_instance)}`);
    const instance = state['instance'] as { state?: string } | undefined;
    const secret = process.env['EVOLUTION_WEBHOOK_SIGNING_KEY'];
    if (!secret) throw new Error('A segurança do recebimento ainda não está configurada.');
    const origin = new URL(data.callbackOrigin);
    const allowed = ['https://id-preview--622f4b9e-289b-53b6-af7a-3ff5229c16ec.lovable.app', 'https://project--622f4b9e-289b-53b6-af7a-3ff5229c16ec.lovable.app', 'https://project--622f4b9e-289b-53b6-af7a-3ff5229c16ec-dev.lovable.app'];
    if (!allowed.includes(origin.origin)) throw new Error('Use o endereço público deste aplicativo para ativar o recebimento.');
    await evolutionRequest(c.evolution_api_url, c.evolution_api_key, `/webhook/set/${encodeURIComponent(c.evolution_instance)}`, {
      webhook: { enabled: true, url: `${origin.origin}/api/public/evolution/${c.salon_id}`, webhookByEvents: false, webhookBase64: false,
        headers: { 'x-salon-webhook-token': await tenantWebhookToken(c.salon_id, secret) }, events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE'] },
    });
    const update = await context.supabase.from('configuracoes_salao').update({ evolution_connection_state: instance?.state || 'desconhecido', evolution_webhook_enabled: true }).eq('user_id', context.userId);
    if (update.error) throw new Error(update.error.message);
    return { state: instance?.state || 'desconhecido' };
  });

export const sendSalonMessage = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ salonId: z.string().uuid(), phone: z.string().max(30), body: z.string().trim().min(1).max(4000), appointmentId: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const access = await context.supabase.rpc('manages_salon', { _salon: data.salonId });
    if (access.error || !access.data) throw new Error('Sem acesso às mensagens deste salão.');
    if (data.appointmentId) {
      const appointment = await context.supabase.from('appointments').select('id').eq('id', data.appointmentId).eq('salon_id', data.salonId).single();
      if (appointment.error) throw new Error('Agendamento não pertence ao salão.');
    }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const accessCheck = await supabaseAdmin.rpc('salon_access_allowed', { _salon: data.salonId });
    if (accessCheck.error || !accessCheck.data) throw new Error('O salão está suspenso.');
    const salon = await supabaseAdmin.from('salons').select('owner_id').eq('id', data.salonId).single();
    if (salon.error) throw new Error('Salão não encontrado.');
    const config = await supabaseAdmin.from('configuracoes_salao').select('evolution_api_url, evolution_api_key, evolution_instance').eq('salon_id', data.salonId).eq('user_id', salon.data.owner_id).single();
    const c = config.data;
    if (config.error || !c?.evolution_api_url || !c.evolution_api_key || !c.evolution_instance) throw new Error('A dona precisa configurar a Evolution primeiro.');
    const phone = evolutionPhone(data.phone);
    const saved = await supabaseAdmin.from('salon_messages').insert({ salon_id: data.salonId, contact_phone: phone, direction: 'outbound', body: data.body, appointment_id: data.appointmentId ?? null, created_by: context.userId }).select('id').single();
    if (saved.error) throw new Error(saved.error.message);
    const { evolutionRequest } = await import('./evolution.server');
    try {
      const response = await evolutionRequest(c.evolution_api_url, c.evolution_api_key, `/message/sendText/${encodeURIComponent(c.evolution_instance)}`, { number: phone, text: data.body, linkPreview: false });
      const key = response['key'] as { id?: string } | undefined;
      if (!key?.id) throw new Error('Resposta sem identificador; confira a mensagem no WhatsApp antes de reenviar.');
      const updated = await supabaseAdmin.from('salon_messages').update({ provider_message_id: key.id, status: 'accepted' }).eq('id', saved.data.id);
      if (updated.error) throw new Error('Envio aceito; não foi possível salvar o identificador. Confira antes de reenviar.');
      const { processEvolutionEvents } = await import('./evolution-inbox.server');
      await processEvolutionEvents(data.salonId);
      return { id: saved.data.id, status: 'accepted' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha no envio.';
      const failed = await supabaseAdmin.from('salon_messages').update({ status: 'unknown', error: message }).eq('id', saved.data.id);
      if (failed.error) throw new Error('Falha ao registrar o envio. Confira no WhatsApp antes de reenviar.');
      throw new Error(message);
    }
  });