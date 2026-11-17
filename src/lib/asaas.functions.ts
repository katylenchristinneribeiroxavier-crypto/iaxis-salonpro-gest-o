import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { asaasFetch, confirmFromAsaas } from './asaas.server';
import { planCharge } from './plans';

const pixInput = z.object({
  planId: z.string().uuid(),
  ciclo: z.enum(['mensal', 'anual']),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(30).optional().default(''),
  cpfCnpj: z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length === 11 || v.length === 14, 'CPF ou CNPJ inválido'),
  aceitou: z.literal(true),
  userId: z.string().uuid().nullable().optional(),
});

export const createSubscriptionPix = createServerFn({ method: 'POST' })
  .inputValidator((d) => pixInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: plan, error: pe } = await supabaseAdmin.from('plans').select('id, name, price, annual_monthly_price').eq('id', data.planId).single();
    if (pe || !plan) throw new Error('Plano não encontrado');
    const amount = planCharge(plan, data.ciclo); // price always comes from the plan, never from the browser
    const { data: req, error } = await supabaseAdmin.from('subscription_requests').insert({
      user_id: data.userId ?? null, name: data.name, email: data.email, phone: data.phone,
      plan_id: plan.id, billing: data.ciclo, amount, aceitou_termos: true,
    }).select('id').single();
    if (error || !req) throw new Error('Não foi possível registrar o pedido');
    const customer = await asaasFetch<{ id: string }>('/customers', { method: 'POST', body: JSON.stringify({ name: data.name, email: data.email, cpfCnpj: data.cpfCnpj, mobilePhone: data.phone.replace(/\D/g, '') || undefined, externalReference: req.id }) });
    const due = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const payment = await asaasFetch<{ id: string }>('/payments', { method: 'POST', body: JSON.stringify({ customer: customer.id, billingType: 'PIX', value: amount, dueDate: due, description: `IAxis SalonPRO — Plano ${plan.name} ${data.ciclo}`, externalReference: req.id }) });
    await supabaseAdmin.from('subscription_requests').update({ asaas_payment_id: payment.id }).eq('id', req.id);
    const qr = await asaasFetch<{ encodedImage: string; payload: string; expirationDate: string }>(`/payments/${payment.id}/pixQrCode`);
    return { requestId: req.id, amount, qrImage: qr.encodedImage, copiaECola: qr.payload, expiresAt: qr.expirationDate };
  });

export const subscriptionPixStatus = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: req } = await supabaseAdmin.from('subscription_requests').select('status, asaas_payment_id').eq('id', data.requestId).maybeSingle();
    if (!req) return { status: 'desconhecido' };
    if (req.status === 'confirmado') return { status: 'confirmado' };
    if (!req.asaas_payment_id) return { status: req.status };
    return { status: await confirmFromAsaas(req.asaas_payment_id) };
  });

export const testAsaasConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ok } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'super_admin' });
    if (!ok) throw new Error('Acesso restrito');
    const hasKey = !!process.env['ASAAS_API_KEY'];
    const hasWebhook = !!process.env['ASAAS_WEBHOOK_TOKEN'];
    if (!hasKey) return { connected: false, hasWebhook, message: 'Chave do Asaas ainda não foi salva.' };
    try {
      const acc = await asaasFetch<{ name?: string }>('/myAccount');
      return { connected: true, hasWebhook, message: `Conectado à conta Asaas${acc.name ? ` de ${acc.name}` : ''} (produção).` };
    } catch (e) {
      return { connected: false, hasWebhook, message: e instanceof Error ? e.message : 'Falha ao conectar.' };
    }
  });
