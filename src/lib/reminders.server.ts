import { createServerOnlyFn } from '@tanstack/react-start';
import { evolutionPhone } from './evolution';
import { brazilCalendar } from './brazil-calendar';
import { brasiliaDate } from './automatic-finance';

export const processSalonReminders = createServerOnlyFn(async () => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const control = await db.from('platform_reminder_control').select('enabled').eq('id', true).maybeSingle();
  if (control.error) throw new Error('Não foi possível consultar a ativação');
  if (!control.data?.enabled) return { active: false, accepted: 0 };
  const today = brasiliaDate();
  const events = brazilCalendar(Number(today.slice(0, 4))).filter(e => e.date === today && e.message);
  if (events.length) {
    const salons = await db.from('salon_automation_preferences').select('salon_id').eq('special_date_messages', true);
    if (salons.error) throw new Error('Não foi possível consultar datas especiais');
    for (const salon of salons.data) for (const event of events) {
      if (!event.message) continue;
      const result = await db.rpc('queue_special_date', { _salon: salon.salon_id, _date: today, _key: event.key, _message: event.message });
      if (result.error) throw new Error('Não foi possível preparar a mensagem da data');
    }
  }
  const prepared = await db.rpc('prepare_salon_reminders', {});
  if (prepared.error) throw new Error('Não foi possível preparar lembretes');
  const connected = await db.from('configuracoes_salao').select('salon_id').eq('evolution_connection_state', 'open');
  if (connected.error) throw new Error('Não foi possível consultar conexões');
  for (const salon of connected.data) { const r = await db.rpc('activate_evolving_queue', { _salon: salon.salon_id }); if (r.error) throw new Error('Não foi possível ativar mensagens preparadas'); }
  const claimed = await db.rpc('claim_salon_reminders', { _limit: 5 });
  if (claimed.error) throw new Error('Não foi possível recuperar lembretes');
  let accepted = 0;
  const { resolveEvolutionConfig, evolutionRequest } = await import('./evolution.server');
  for (const row of claimed.data) {
    let attempted = false;
    try {
      const allowed = await db.rpc('salon_access_allowed', { _salon: row.salon_id });
      if (allowed.error || !allowed.data) throw new Error('Salão suspenso');
      const prefs = await db.from('salon_automation_preferences').select('*').eq('salon_id', row.salon_id).maybeSingle();
      if (prefs.error) throw new Error('Preferências indisponíveis');
      if ((row.tipo === 'lembrete_24h' && prefs.data?.reminder_24h === false) || (row.tipo === 'agradecimento' && prefs.data?.thank_you_messages === false) || (row.tipo === 'cliente_sumida' && prefs.data?.intelligent_return === false)) throw new Error('Mensagem desativada pelo salão');
      if (row.tipo === 'data_especial' && !prefs.data?.special_date_messages) throw new Error('Mensagens de datas especiais desativadas pelo salão');
      if ((row.tipo === 'lembrete_agendamento' && prefs.data?.appointment_reminders === false) || (row.tipo === 'aniversario' && !prefs.data?.birthday_reminders) || (row.tipo === 'retorno' && !prefs.data?.return_reminders)) throw new Error('Lembrete desativado pelo salão');
      if (row.appointment_id && row.tipo !== 'agradecimento') {
        const appt = await db.from('appointments').select('status,starts_at').eq('id', row.appointment_id).eq('salon_id', row.salon_id).single();
        const advance = row.tipo === 'lembrete_24h' ? 86400000 : 3600000;
        if (appt.error || ['cancelado', 'finalizado'].includes(appt.data.status) || new Date(appt.data.starts_at).getTime() <= Date.now() || new Date(appt.data.starts_at).getTime() - advance !== new Date(row.agendado_para).getTime()) throw new Error('Agendamento alterado ou encerrado');
      }
      if (row.appointment_id && row.tipo === 'agradecimento') { const r = await db.from('appointments').select('status').eq('id', row.appointment_id).eq('salon_id', row.salon_id).single(); if (r.error || r.data.status !== 'finalizado') throw new Error('Atendimento não concluído'); }
      if (row.tipo === 'cliente_sumida' && row.client_id) { const r = await db.from('appointments').select('id').eq('salon_id', row.salon_id).eq('salon_client_id', row.client_id).gt('starts_at', new Date().toISOString()).neq('status', 'cancelado').limit(1); if (r.error || r.data.length) throw new Error('Cliente já possui retorno agendado'); }
      let phone = row.cliente_whatsapp;
      if (row.client_id) {
        const client = await db.from('salon_clients').select('whatsapp,consent').eq('id', row.client_id).eq('salon_id', row.salon_id).single();
        if (client.error || !client.data.consent) throw new Error('Cliente sem autorização para mensagens');
        phone = client.data.whatsapp;
      }
      if (!phone) throw new Error('Sem WhatsApp; lembrete disponível dentro do app');
      const config = await resolveEvolutionConfig(row.salon_id);
      if (config.evolution_connection_state !== 'open') throw new Error('WhatsApp do salão desconectado');
      const number = evolutionPhone(phone);
      attempted = true;
      const response = await evolutionRequest(config.evolution_api_url, config.evolution_api_key, `/message/sendText/${encodeURIComponent(config.evolution_instance)}`, { number, text: row.mensagem, linkPreview: false });
      const key = response['key'] as { id?: string } | undefined;
      if (!key?.id) throw new Error('Envio sem confirmação da API');
      const saved = await db.from('fila_mensagens_ia').update({ status: 'enviado', provider_message_id: key.id, sent_at: new Date().toISOString(), error: '' }).eq('id', row.id);
      if (saved.error) throw new Error('Envio aceito; registro pendente');
      accepted++;
    } catch (error) {
      const saved = await db.from('fila_mensagens_ia').update({ status: attempted ? 'verificar' : 'nao_enviado', error: attempted ? 'Confira no WhatsApp antes de reenviar; resultado incerto.' : error instanceof Error ? error.message : 'Envio não realizado' }).eq('id', row.id);
      if (saved.error) throw new Error('Não foi possível registrar o resultado');
    }
  }
  return { active: true, accepted };
});