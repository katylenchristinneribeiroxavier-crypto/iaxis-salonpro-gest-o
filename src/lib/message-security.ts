import { z } from 'zod';
import { evolutionPhone } from './evolution';

export const salonMessageSchema = z.object({
  salonId: z.string().uuid(),
  phone: z.string().trim().min(1).max(30).transform(evolutionPhone),
  body: z.string().trim().min(1).max(4000),
  appointmentId: z.string().uuid().optional(),
});