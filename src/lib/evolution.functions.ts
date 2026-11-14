import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { salonMessageSchema } from './message-security';

export const getEvolutionSettings = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const salon = await context.supabase.from('salons').select('id').eq('owner_id', context.userId).maybeSingle();
    if (salon.error) throw new Error('Não foi possível consultar o salão.');
    if (!salon.data) return null;
    const access = await context.supabase.rpc('owns_salon', { _salon: salon.data.id });
    if (access.error || !access.data) throw new Error('Sem acesso à conexão do salão.');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const result = await db.from('configuracoes_salao')
      .select('salon_id, whatsapp_salao, evolution_instance, evolution_connection_state, evolution_webhook_enabled, evolution_last_received_at')
      .eq('user_id', context.userId).eq('salon_id', salon.data.id).maybeSingle();
    if (result.error) throw new Error('Não foi possível consultar a conexão.');
    if (!result.data) return null;
    const { evolution_instance, ...safe } = result.data;
    return { ...safe, hasConnection: Boolean(evolution_instance) };
  });

export const sendSalonMessage = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salonMessageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const access = await context.supabase.rpc('manages_salon', { _salon: data.salonId });
    if (access.error || !access.data) throw new Error('Sem acesso às mensagens deste salão.');
    const recipient = await context.supabase.rpc('salon_message_recipient_allowed', { _salon: data.salonId, _phone: data.phone, _appointment: data.appointmentId ?? null });
    if (recipient.error || !recipient.data) throw new Error('Envie apenas para clientes, agendamentos ou conversas recebidas deste salão.');
    if (data.appointmentId) {
      const appointment = await context.supabase.from('appointments').select('id').eq('id', data.appointmentId).eq('salon_id', data.salonId).single();
      if (appointment.error) throw new Error('Agendamento não pertence ao salão.');
    }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const accessCheck = await supabaseAdmin.rpc('salon_access_allowed', { _salon: data.salonId });
    if (accessCheck.error || !accessCheck.data) throw new Error('O salão está suspenso.');
    const salon = await supabaseAdmin.from('salons').select('owner_id').eq('id', data.salonId).single();
    if (salon.error) throw new Error('Salão não encontrado.');
    const { resolveEvolutionConfig } = await import('./evolution.server');
    const c = await resolveEvolutionConfig(data.salonId);
    if (c.user_id !== salon.data.owner_id || !c.evolution_api_url || !c.evolution_api_key || !c.evolution_instance) throw new Error('A dona precisa conectar o WhatsApp primeiro.');
    if (c.evolution_managed && c.evolution_connection_state !== 'open') throw new Error('Reconecte o WhatsApp do salão antes de enviar.');
    const phone = data.phone;
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