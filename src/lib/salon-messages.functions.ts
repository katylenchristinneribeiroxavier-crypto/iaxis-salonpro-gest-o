import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const recoverSalonMessages = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.string().uuid().parse(input))
  .handler(async ({ data, context }) => {
    const access = await context.supabase.rpc('manages_salon', { _salon: data });
    if (access.error || !access.data) throw new Error('Sem acesso a este salão.');
    const { processEvolutionEvents } = await import('./evolution-inbox.server');
    await processEvolutionEvents(data);
    return { recovered: true };
  });