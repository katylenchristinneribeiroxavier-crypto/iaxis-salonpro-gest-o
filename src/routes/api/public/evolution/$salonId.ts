import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { evolutionEnvelope } from '@/lib/evolution';

export const Route = createFileRoute('/api/public/evolution/$salonId')({
  server: { handlers: { POST: async ({ request, params }) => {
    const parsed = z.string().uuid().safeParse(params.salonId);
    if (!parsed.success) return new Response('Invalid salon', { status: 400 });
    const secret = process.env['EVOLUTION_WEBHOOK_SIGNING_KEY'];
    if (!secret) return new Response('Receiver unavailable', { status: 503 });
    const { validWebhookToken } = await import('@/lib/evolution.server');
    if (!await validWebhookToken(request.headers.get('x-salon-webhook-token') || '', parsed.data, secret)) return new Response('Unauthorized', { status: 401 });
    // Read with a hard bound, before parsing or persisting provider data.
    const reader = request.body?.getReader();
    if (!reader) return new Response('Missing body', { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const result = await reader.read(); if (result.done) break; size += result.value.length; if (size > 1024 * 1024) { await reader.cancel(); return new Response('Too large', { status: 413 }); } chunks.push(result.value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let raw: unknown;
    try { raw = JSON.parse(new TextDecoder().decode(bytes)); } catch { return new Response('Invalid JSON', { status: 400 }); }
    const payload = evolutionEnvelope.safeParse(raw);
    if (!payload.success) return new Response('Invalid event', { status: 400 });
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const config = await db.from('configuracoes_salao').select('evolution_instance').eq('salon_id', parsed.data).single();
    const access = await db.rpc('salon_access_allowed', { _salon: parsed.data });
    if (config.error || access.error) return new Response('Configuration unavailable', { status: 503 });
    if (!access.data || config.data.evolution_instance !== payload.data.instance) return new Response('Forbidden', { status: 403 });
    const safePayload = payload.data; // strips provider apikey and unneeded envelope fields
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(safePayload)));
    const eventKey = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    const persisted = await db.from('evolution_webhook_events').upsert({ salon_id: parsed.data, event_key: eventKey, event: safePayload.event.toLowerCase().replace(/_/g, '.'), payload: safePayload as never }, { onConflict: 'salon_id,event_key', ignoreDuplicates: true });
    if (persisted.error) return new Response('Persistence failed', { status: 503 });
    const update = await db.from('configuracoes_salao').update({ evolution_last_received_at: new Date().toISOString() }).eq('salon_id', parsed.data);
    if (update.error) return new Response('Persistence failed', { status: 503 });
    const { processEvolutionEvents } = await import('@/lib/evolution-inbox.server');
    await processEvolutionEvents(parsed.data);
    return Response.json({ received: true });
  } } },
});