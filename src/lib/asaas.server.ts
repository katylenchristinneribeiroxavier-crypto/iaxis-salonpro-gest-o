// Asaas production API only (no sandbox). Key is read per call from the server runtime.
const ASAAS_BASE = 'https://api.asaas.com/v3';

export async function asaasFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env['ASAAS_API_KEY'];
  if (!key) throw new Error('Pagamento Pix ainda não configurado.');
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'IAxisSalonPRO', access_token: key, ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Asaas ${path} failed [${res.status}]: ${text}`);
    throw new Error(`Asaas recusou a operação (${res.status}).`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Re-reads a payment from Asaas and confirms the matching purchase only if paid with the exact amount. */
export async function confirmFromAsaas(paymentId: string) {
  const p = await asaasFetch<{ id: string; status: string; value: number; externalReference?: string }>(`/payments/${encodeURIComponent(paymentId)}`);
  if (!['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status)) return 'pendente';
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: req } = await supabaseAdmin.from('subscription_requests').select('id, amount, status, asaas_payment_id, user_id').eq('asaas_payment_id', p.id).maybeSingle();
  if (!req || req.id !== p.externalReference || !req.user_id) return 'desconhecido';
  if (req.status === 'confirmado') return 'confirmado';
  if (Math.round(Number(req.amount) * 100) !== Math.round(Number(p.value) * 100)) {
    console.error(`Asaas amount mismatch for ${req.id}`);
    return 'valor_divergente';
  }
  const { error } = await supabaseAdmin.from('subscription_requests').update({ status: 'confirmado', confirmed_at: new Date().toISOString() }).eq('id', req.id).neq('status', 'confirmado');
  if (error) throw error;
  return 'confirmado';
}
