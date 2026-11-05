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
    const safe = text.split(key).join('[credencial omitida]').slice(0, 800);
    throw new Error(`Evolution (${response.status}): ${safe}`);
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