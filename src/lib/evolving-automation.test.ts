import { describe, expect, it } from 'vitest';
import { productionSummary, visitPattern } from './evolving-automation';
describe('Automação por histórico real', () => {
  it('aprende progressiva a cada 90 dias', () => expect(visitPattern(['2026-01-01', '2026-04-01', '2026-06-30'])).toBe(90));
  it('não inventa frequência com apenas uma visita', () => expect(visitPattern(['2026-01-01'])).toBeNull());
  it('soma produção concluída por dia, semana, mês e ano sem assumir pagamento', () => {
    const r = productionSummary([{ id: 'a', date: '2026-11-07', value: 50, paid: false, commission: 20, product_cost: 10 }, { id: 'b', date: '2026-11-01', value: 30, paid: true, commission: 9, product_cost: 0 }], '2026-11-07');
    expect(r.daily).toBe(50); expect(r.weekly).toBe(50); expect(r.monthly).toBe(80); expect(r.annual).toBe(80); expect(r.productMargin).toBe(70);
  });
});