export type Ciclo = "mensal" | "anual";

/** Valor cobrado no ato: mensal = preço do mês; anual = 12x o valor mensal do plano anual. */
export function planCharge(plan: { price: number | string; annual_monthly_price: number | string }, ciclo: Ciclo) {
  return ciclo === "anual"
    ? Math.round(Number(plan.annual_monthly_price) * 12 * 100) / 100
    : Number(plan.price);
}
