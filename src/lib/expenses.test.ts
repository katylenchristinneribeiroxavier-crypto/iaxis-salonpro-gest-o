import { describe, expect, it } from 'vitest';
import { despesasCsv } from './expenses';

describe('despesasCsv', () => {
  it('formata data e valor no padrão brasileiro', () => {
    const csv = despesasCsv([{ data_documento: '2026-11-06', tipo: 'nota_fiscal', fornecedor: 'Loja "A"', numero_documento: '123', categoria: 'Aluguel', descricao: 'x', valor: 1234.5 }]);
    const line = csv.split('\r\n')[1];
    expect(line).toBe('"06/11/2026";"Nota fiscal";"Loja ""A""";"123";"Aluguel";"x";1234,50');
  });
});
