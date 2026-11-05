import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const saveSalonSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    nome_salao: z.string().trim().min(1).max(160),
    whatsapp_salao: z.string().regex(/^\d{10,11}$/),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const own = await context.supabase.from('salons').select('id, owner_id').eq('owner_id', context.userId).single();
    if (own.error || !own.data) throw new Error('Cadastre seu salão antes de configurar o WhatsApp.');
    const result = await context.supabase.from('configuracoes_salao').upsert({
      user_id: context.userId, salon_id: own.data.id, ...data,
    }, { onConflict: 'user_id' });
    if (result.error) throw new Error(result.error.message);
    const name = await context.supabase.from('salons').update({ name: data.nome_salao }).eq('id', own.data.id);
    if (name.error) throw new Error(name.error.message);
    return { saved: true };
  });