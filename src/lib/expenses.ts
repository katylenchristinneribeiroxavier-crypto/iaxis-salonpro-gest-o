export const EXPENSE_CATEGORIES = ['Produtos e insumos', 'Aluguel', 'Água, luz e internet', 'Equipamentos', 'Marketing', 'Impostos e taxas', 'Salários e comissões', 'Manutenção', 'Transporte', 'Alimentação', 'Software e assinaturas', 'Outros'] as const;

export type ExpenseRow = { data_documento: string | null; tipo: string; fornecedor: string; numero_documento: string; categoria: string; descricao: string; valor: number | string };

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** CSV em padrão brasileiro (ponto e vírgula, vírgula decimal) para abrir direto no Excel. */
export function despesasCsv(rows: ExpenseRow[]): string {
  const head = ['Data', 'Tipo', 'Fornecedor', 'Nº documento', 'Categoria', 'Descrição', 'Valor (R$)'];
  const lines = rows.map(r => [
    r.data_documento ? r.data_documento.split('-').reverse().join('/') : '',
    r.tipo === 'nota_fiscal' ? 'Nota fiscal' : 'Recibo', r.fornecedor, r.numero_documento, r.categoria, r.descricao,
  ].map(cell).concat(Number(r.valor).toFixed(2).replace('.', ',')).join(';'));
  return '\uFEFF' + [head.map(cell).join(';'), ...lines].join('\r\n');
}
