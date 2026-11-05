import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const bookingCatalogSchema = z.object({
  salon: z.object({ id: z.string(), name: z.string(), timezone: z.string(), opening_time: z.string(), closing_time: z.string(), nome_agente: z.string(), genero: z.enum(['masculino','feminino','neutro']), name_article: z.string() }),
  services: z.array(z.object({ id: z.string(), name: z.string(), price: z.number(), duration_min: z.number() })),
  professionals: z.array(z.object({ id: z.string(), name: z.string() })),
});
export const bookingResultSchema = z.object({ id: z.string(), starts_at: z.string(), deposit: z.number(), price: z.number(), status_sinal: z.string(), pix_key: z.string(), pix_holder: z.string(), pix_city: z.string() });
export const bookingCatalogOptions = (salonId: string) => queryOptions({
  queryKey: ['booking-assistant-catalog', salonId],
  queryFn: async () => {
    const result = await supabase.rpc('salon_booking_catalog', { _salon: salonId });
    if (result.error) throw result.error;
    return bookingCatalogSchema.parse(result.data);
  },
});