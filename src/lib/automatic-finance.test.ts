import { describe, expect, it } from 'vitest';
import { brasiliaDate, financialTotals, monthDays } from './automatic-finance';
const paid = [{ price: 50, commission_amount: 20, status: 'finalizado', payment_status: 'pago' }, { price: 30, commission_amount: 9, status: 'finalizado', payment_status: 'pago' }];
describe('Financeiro automático', () => {
  it('soma escova de R$50 e unha de R$30 pagas', () => expect(financialTotals(paid, 0, 0, 0, 0).revenue).toBe(80));
  it('não inclui atendimento pendente nem cancelado', () => expect(financialTotals([...paid, { price: 100, commission_amount: 50, status: 'finalizado', payment_status: 'pendente' }, { price: 90, commission_amount: 40, status: 'cancelado', payment_status: 'pago' }], 0, 0, 0, 0).revenue).toBe(80));
  it('separa comissão de 40% da escova e 30% da unha', () => expect(financialTotals(paid, 0, 0, 0, 0).commissions).toBe(29));
  it('desconta adiantamento sem cobrá-lo duas vezes no lucro', () => expect(financialTotals(paid, 10, 15, 0, 0)).toMatchObject({ receivable: 14, cashProfit: 41 }));
  it('compra e consumo de produto não duplicam custo operacional', () => expect(financialTotals(paid, 30, 0, 5, 20).operatingProfit).toBe(36));
  it('acompanha virada do mês em Brasília', () => expect(brasiliaDate(new Date('2027-01-01T02:30:00Z'))).toBe('2026-12-31'));
  it('fevereiro tem dias reais inclusive ano bissexto', () => { expect(monthDays('2028-02')).toBe(29); expect(monthDays('2026-02')).toBe(28); });
});