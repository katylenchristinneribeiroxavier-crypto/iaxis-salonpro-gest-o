import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { confirmFromAsaas, safeEqual } from '@/lib/asaas.server';

const body = z.object({ event: z.string().max(80), payment: z.object({ id: z.string().min(1).max(80) }).passthrough().optional() }).passthrough();

export const Route = createFileRoute('/api/public/asaas-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env['ASAAS_WEBHOOK_TOKEN'];
        const got = request.headers.get('asaas-access-token') ?? '';
        if (!expected || !safeEqual(got, expected)) return new Response('Unauthorized', { status: 401 });
        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response('Bad request', { status: 400 });
        const { event, payment } = parsed.data;
        if (payment && ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event)) {
          try { await confirmFromAsaas(payment.id); } catch (e) { console.error(e); return new Response('Retry', { status: 500 }); }
        }
        return Response.json({ ok: true });
      },
    },
  },
});
