import { describe, expect, it } from 'vitest';
import { intervaloMes, lucroMes, totaisPorCategoria } from './salon-expenses';

describe('despesas do salão', () => {
  it('lucro = faturamento - despesas', () => {
    expect(lucroMes(5000, 1800.5)).toBe(3199.5);
    expect(lucroMes(1000, 1500)).toBe(-500);
  });
  it('soma por categoria', () => {
    expect(totaisPorCategoria([{ categoria: 'Luz', valor: 100 }, { categoria: 'Aluguel', valor: 900 }, { categoria: 'Luz', valor: 50 }]))
      .toEqual([{ categoria: 'Aluguel', total: 900 }, { categoria: 'Luz', total: 150 }]);
  });
  it('intervalo vira o ano em dezembro', () => {
    expect(intervaloMes('2026-12')).toEqual({ inicio: '2026-12-01', fim: '2027-01-01' });
  });
});
