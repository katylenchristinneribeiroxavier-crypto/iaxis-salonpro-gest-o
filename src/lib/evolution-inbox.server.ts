import { createServerOnlyFn } from '@tanstack/react-start';
import { advanceMessageStatus, evolutionStatus, parseEvolutionMessage } from './evolution';

export const processEvolutionEvents = createServerOnlyFn(async (salonId: string) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const access = await db.rpc('salon_access_allowed', { _salon: salonId });
  if (access.error || !access.data) throw new Error('Salão sem acesso às mensagens.');
  const pending = await db.from('evolution_webhook_events').select('*').eq('salon_id', salonId).is('processed_at', null).lte('retry_at', new Date().toISOString()).order('retry_at').limit(15);
  if (pending.error) throw new Error('Não foi possível recuperar mensagens pendentes.');
  for (const event of pending.data) {
    try {
      const envelope = event.payload as { data?: unknown };
      const items = Array.isArray(envelope.data) ? envelope.data : [envelope.data];
      let unmatched = false;
      if (event.event === 'connection.update') {
        const connection = envelope.data as { state?: string } | undefined;
        if (connection?.state && ['open', 'close', 'connecting'].includes(connection.state)) {
          const updated = await db.from('configuracoes_salao').update({ evolution_connection_state: connection.state }).eq('salon_id', salonId);
          if (updated.error) throw updated.error;
        }
      }
      for (const item of items) {
        if (event.event === 'messages.upsert') {
          const message = parseEvolutionMessage(item);
          if (!message) continue;
          const existing = await db.from('salon_messages').select('id').eq('salon_id', salonId).eq('provider_message_id', message.id).maybeSingle();
          if (existing.error) throw existing.error;
          if (!existing.data) {
            const inserted = await db.from('salon_messages').upsert({ salon_id: salonId, contact_phone: message.phone, contact_name: message.name,
              direction: message.fromMe ? 'outbound' : 'inbound', body: message.body, provider_message_id: message.id,
              status: message.fromMe ? message.status : 'received', provider_timestamp: message.timestamp,
            }, { onConflict: 'salon_id,provider_message_id', ignoreDuplicates: true });
            if (inserted.error) throw inserted.error;
          }
        } else if (event.event === 'messages.update') {
          const statusItem = item as { key?: { id?: string }; update?: { status?: unknown }; status?: unknown } | undefined;
          if (!statusItem?.key?.id) continue;
          const current = await db.from('salon_messages').select('id, status').eq('salon_id', salonId).eq('provider_message_id', statusItem.key.id).maybeSingle();
          if (current.error) throw current.error;
          if (!current.data) { unmatched = true; continue; }
          const updated = await db.from('salon_messages').update({ status: advanceMessageStatus(current.data.status, evolutionStatus(statusItem.update?.status ?? statusItem.status)) }).eq('id', current.data.id);
          if (updated.error) throw updated.error;
        }
      }
      if (!unmatched) {
        const done = await db.from('evolution_webhook_events').update({ processed_at: new Date().toISOString(), processing_error: '' }).eq('id', event.id);
        if (done.error) throw done.error;
      } else {
        const deferred = await db.from('evolution_webhook_events').update({ retry_at: new Date(Date.now() + 15000).toISOString() }).eq('id', event.id);
        if (deferred.error) throw deferred.error;
      }
    } catch {
      const failure = await db.from('evolution_webhook_events').update({ retry_at: new Date(Date.now() + 30000).toISOString(), processing_error: 'Processamento pendente; será retomado nas próximas mensagens ou atualização da caixa.' }).eq('id', event.id);
      if (failure.error) throw new Error('Falha ao persistir processamento.');
    }
  }
});