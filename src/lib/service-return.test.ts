import { describe, it, expect } from 'vitest';
import { serviceDefaults, returnDays, addReturnDays, importDate, normalizeImportPhone } from './service-return';
describe('intervalos por serviço', () => {
  for (const [name, days] of [['Unha mão e pé',14],['Alongamento',14],['Esmaltação',14],['Retoque de raiz',20],['Coloração',20],['Tintura',20],['Sobrancelha',15],['Corte',45],['Mechas',60],['Luzes',60]] as const) it(name,()=>expect(serviceDefaults(name).days).toBe(days));
  for (const name of ['Progressiva','Botox','Selagem']) {
    it(`${name}: três primeiros atendimentos`,()=>expect(returnDays(30,serviceDefaults(name).rule,90,3,'2026-01-01','2026-05-01')).toBe(30));
    it(`${name}: antiga acima de três meses`,()=>expect(returnDays(30,serviceDefaults(name).rule,90,4,'2026-01-01','2026-05-01')).toBe(90));
  }
  it('respeita edição da dona',()=>expect(returnDays(21,'fixa',21,8,'2025-01-01','2026-01-01')).toBe(21));
  it('retorno atravessa dezembro',()=>expect(addReturnDays('2026-12-25',14)).toBe('2027-01-08'));
  it('data brasileira',()=>expect(importDate('07/11/2026')).toBe('2026-11-07'));
  it('rejeita data inválida',()=>expect(importDate('31/02/2026')).toBe(''));
  it('telefone brasileiro',()=>expect(normalizeImportPhone('(11) 99999-8888')).toBe('5511999998888'));
});