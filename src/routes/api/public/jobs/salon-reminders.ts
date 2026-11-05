import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

export const Route = createFileRoute('/api/public/jobs/salon-reminders')({
  server: { handlers: { POST: async ({ request }) => {
    const denied = await authenticateCronRequest(request);
    if (denied) return denied;
    const parsed = z.object({ kind: z.literal('salon-reminders') }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return new Response('Invalid request', { status: 400 });
    try {
      const { processSalonReminders } = await import('@/lib/reminders.server');
      return Response.json(await processSalonReminders());
    } catch { return Response.json({ error: 'Processing unavailable' }, { status: 503 }); }
  } } },
});