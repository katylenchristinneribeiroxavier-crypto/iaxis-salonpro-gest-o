import { z } from 'zod';

export function evolutionBaseUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443' || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.') || /^\d+[.]/.test(host) || host.includes(':')) {
    throw new Error('Use uma URL HTTPS pública da Evolution.');
  }
  url.search = ''; url.hash = '';
  return url.toString().replace(/\/+$/, '');
}
export function evolutionPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const international = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  if (!/^\d{12,15}$/.test(international)) throw new Error('Informe DDD e um WhatsApp válido.');
  return international;
}
export function managedEvolutionInstance(salonId: string) {
  return `iaxis-${z.string().uuid().parse(salonId)}`;
}
export function evolutionPairing(response: unknown) {
  const parsed = z.object({ base64: z.string().optional(), code: z.string().optional(), pairingCode: z.string().optional(), qrcode: z.object({ base64: z.string().optional(), code: z.string().optional() }).optional() }).parse(response);
  const image = parsed.base64 || parsed.qrcode?.base64 || '';
  return { qrImage: /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image) ? image : '', qrText: parsed.code || parsed.qrcode?.code || '', pairingCode: parsed.pairingCode || '' };
}
export function evolutionStatus(value: unknown) {
  const status = String(value).toUpperCase();
  if (['4', 'READ', 'PLAYED', '5'].includes(status)) return 'read';
  if (['3', 'DELIVERY_ACK'].includes(status)) return 'delivered';
  if (['2', 'SERVER_ACK'].includes(status)) return 'sent';
  if (['0', 'ERROR'].includes(status)) return 'failed';
  return 'accepted';
}
export function advanceMessageStatus(current: string, next: string) {
  const rank: Record<string, number> = { pending: 0, accepted: 1, sent: 2, delivered: 3, read: 4 };
  if (next === 'failed') return current === 'read' || current === 'delivered' ? current : next;
  return (rank[next] ?? 0) >= (rank[current] ?? 0) ? next : current;
}
export const evolutionEnvelope = z.object({
  event: z.string().min(1).max(100), instance: z.string().min(1).max(200), data: z.unknown(),
});
export function parseEvolutionMessage(value: unknown) {
  const result = z.object({
    key: z.object({ id: z.string().min(1), remoteJid: z.string(), fromMe: z.boolean().optional() }),
    pushName: z.string().optional(), messageTimestamp: z.union([z.number(), z.string()]).optional(),
    message: z.object({ conversation: z.string().optional(), extendedTextMessage: z.object({ text: z.string().optional() }).optional() }).passthrough().optional(),
    status: z.union([z.string(), z.number()]).optional(),
  }).safeParse(value);
  if (!result.success || !result.data.key.remoteJid.endsWith('@s.whatsapp.net')) return null;
  const item = result.data;
  const phone = item.key.remoteJid.split('@')[0];
  if (!phone || !/^\d{12,15}$/.test(phone)) return null;
  const timestamp = Number(item.messageTimestamp);
  return { id: item.key.id, phone, fromMe: item.key.fromMe ?? false, name: item.pushName || '',
    body: item.message?.conversation || item.message?.extendedTextMessage?.text || '[Mensagem de mídia]',
    timestamp: Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toISOString() : null,
    status: evolutionStatus(item.status),
  };
}