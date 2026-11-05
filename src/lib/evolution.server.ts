import { createServerOnlyFn } from '@tanstack/react-start';
import { evolutionBaseUrl } from './evolution';

export const evolutionRequest = createServerOnlyFn(async (base: string, key: string, path: string, body?: unknown) => {
  const response = await fetch(`${evolutionBaseUrl(base)}${path}`, {
    method: body === undefined ? 'GET' : 'POST', redirect: 'error',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: body === undefined ? null : JSON.stringify(body), signal: AbortSignal.timeout(12000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw Object.assign(new Error(`Evolution indisponível ou configuração recusada (${response.status}).`), { status: response.status });
  }
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { throw new Error('A Evolution retornou uma resposta inválida.'); }
});
export const tenantWebhookToken = createServerOnlyFn(async (salonId: string, secret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`evolution:${salonId}`));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
});
export const validWebhookToken = createServerOnlyFn(async (received: string, salonId: string, secret: string) => {
  const expected = await tenantWebhookToken(salonId, secret);
  if (received.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
});
export const resolveEvolutionConfig = createServerOnlyFn(async (salonId: string) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const result = await db.from('configuracoes_salao').select('*').eq('salon_id', salonId).single();
  if (result.error || !result.data) throw new Error('Configure o WhatsApp do salão primeiro.');
  const c = result.data;
  if (c.evolution_managed) {
    const platform = await db.from('platform_evolution_settings').select('*').eq('id', true).single();
    if (platform.error || !platform.data?.enabled || !platform.data.verified_at) throw new Error('A conexão central ainda não foi ativada pela desenvolvedora.');
    return { ...c, evolution_api_url: platform.data.api_url, evolution_api_key: platform.data.api_key, callback_origin: platform.data.callback_origin };
  }
  return { ...c, callback_origin: '' };
});
export const setupEvolutionWebhook = createServerOnlyFn(async (base: string, key: string, instance: string, salonId: string, origin: string) => {
  const secret = process.env['EVOLUTION_WEBHOOK_SIGNING_KEY'];
  if (!secret) throw new Error('Segurança do recebimento não configurada.');
  await evolutionRequest(base, key, `/webhook/set/${encodeURIComponent(instance)}`, {
    webhook: { enabled: true, url: `${origin}/api/public/evolution/${salonId}`, webhookByEvents: false, webhookBase64: false,
      headers: { 'x-salon-webhook-token': await tenantWebhookToken(salonId, secret) }, events: ['CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'MESSAGES_UPDATE'] },
  });
});