export const FINANCE_TIMEZONE = 'America/Sao_Paulo';
export const FINANCE_CATEGORIES = ['Produtos', 'Materiais descartáveis', 'Aluguel', 'Água', 'Luz', 'Internet e telefone', 'Salários e benefícios', 'Adiantamento de funcionários', 'Impostos e taxas', 'Taxas de cartão', 'Marketing', 'Equipamentos', 'Manutenção', 'Limpeza e lavanderia', 'Transporte', 'Alimentação', 'Software e assinaturas', 'Seguros', 'Capacitação', 'Empréstimos e juros', 'Outros'] as const;
export function brasiliaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FINANCE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function monthDays(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Mês inválido');
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}
export const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
export function financialTotals(rows: { price: number; commission_amount: number; status: string; payment_status: string }[], expenses: number, advances: number, stock: number, productPurchases: number) {
  const paid = rows.filter(r => r.status === 'finalizado' && r.payment_status === 'pago');
  const revenue = money(paid.reduce((s, r) => s + r.price, 0));
  const commissions = money(paid.reduce((s, r) => s + r.commission_amount, 0));
  return { revenue, commissions, receivable: money(Math.max(0, commissions - advances)), cashProfit: money(revenue - commissions - expenses), operatingProfit: money(revenue - commissions - expenses + productPurchases - stock) };
}
export type FinancialRow = { id: string; starts_at: string; received_at: string; client_name: string; professional_id: string; professional: string; price: number; applied_commission_pct: number; commission_amount: number; salon_amount: number | null };
export type FinanceExpense = { id: string; categoria: string; descricao: string; valor: number; data_despesa: string; arquivo_path: string; professional_id: string | null };
export type FinancialMonth = { month: string; closed: boolean; revenue: number | null; commissions: number; expenses: number | null; advances: number; receivable: number; stock_cost: number | null; cash_profit: number | null; operating_profit: number | null; rows: FinancialRow[]; expense_rows: FinanceExpense[]; professionals: { id: string; name: string; commission: number; advance: number }[] };