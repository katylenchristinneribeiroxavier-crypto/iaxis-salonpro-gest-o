export const SALON_EXPENSE_CATEGORIES = ['Aluguel', 'Produtos', 'Luz', 'Água', 'Internet', 'Salários', 'Impostos', 'Marketing', 'Manutenção', 'Outros'] as const;

export function lucroMes(faturamento: number, despesas: number) {
  return Math.round((faturamento - despesas) * 100) / 100;
}

export function totaisPorCategoria(rows: { categoria: string; valor: number }[]) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.categoria, (m.get(r.categoria) ?? 0) + Number(r.valor));
  return [...m].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
}

export function intervaloMes(month: string) {
  const [y, m] = month.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return { inicio: `${month}-01`, fim: `${next}-01` };
}
