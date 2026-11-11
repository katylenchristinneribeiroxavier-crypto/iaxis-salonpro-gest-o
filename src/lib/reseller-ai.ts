import { z } from 'zod';
export const resellerPlanSchema = z.object({
  goal: z.number().int().min(1).max(10000),
  days: z.number().int().min(1).max(365),
  hours: z.number().min(0.5).max(168),
  region: z.string().trim().min(2).max(160),
  idealCustomer: z.string().trim().min(15).max(3000),
  context: z.string().trim().min(15).max(6000),
});
export const resellerLeadSchema = z.object({
  salonName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().max(160),
  phone: z.string().trim().max(30),
  city: z.string().trim().max(160),
  context: z.string().trim().min(15).max(6000),
  idealCustomer: z.string().trim().min(15).max(3000),
});
export type ResellerPlanInput = z.infer<typeof resellerPlanSchema>;
export function salesSummary(rows: {commission: number; status: string; paid_amount?: number}[]) {
  const validated = rows.filter(r => r.status !== 'cancelado');
  const total=(items:typeof rows)=>Math.round(items.reduce((s,r)=>s+Number(r.commission),0)*100)/100;
  const paid = Math.round(validated.reduce((sum,r)=>sum+Number(r.paid_amount ?? (r.status==='pago' ? r.commission : 0)),0)*100)/100;
  return { count: validated.length, generated: total(validated), paid, pending: Math.round((total(validated)-paid)*100)/100 };
}
export function normalizeQualification(value: {score: number; summary: string; callRecommended: boolean; callReason: string}) {
  if (!Number.isFinite(value.score)) throw new Error('Pontuação inválida');
  return { score: Math.max(0,Math.min(100,Math.round(value.score))), summary: value.summary.slice(0,500), call_recommended: value.callRecommended, call_reason: value.callReason.slice(0,500) };
}