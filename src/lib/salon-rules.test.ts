import { describe, expect, it } from 'vitest';
import { introduction, splitCommission, clientCategory, depositAmount, buildPixPayload , freeSlots } from './salon-rules';
describe('Personalização e regras do salão', () => {
  it('usa nome masculino digitado e tratamento do salão', () => expect(introduction('Júlio', 'Studio Ana', 'masculino', 'do')).toBe('Oi, eu sou o Júlio, eu sou o secretário do Studio Ana'));
  it('usa nome feminino digitado e tratamento do salão', () => expect(introduction('Júlia', 'Espaço Jéssica', 'feminino', 'do')).toBe('Oi, eu sou a Júlia, eu sou a secretária do Espaço Jéssica'));
  it('não inventa nomes para campos vazios', () => expect(introduction('', '')).toBe('Oi, eu sou o/a [NOME QUE VOCÊ DIGITAR], eu sou o/a secretário(a) da [NOME DO SEU SALÃO]'));
  it('divide serviço de 100 com comissão individual de 30%', () => expect(splitCommission(100, 30)).toEqual({ commission: 30, salon: 70 }));
  it('limita comissão individual entre 0 e 100', () => { expect(() => splitCommission(100, -1)).toThrow(); expect(() => splitCommission(100, 101)).toThrow(); expect(splitCommission(100, 100).salon).toBe(0); });
  it('calcula comissão de revenda de 20%', () => expect(splitCommission(100, 20).commission).toBe(20));
  it('classifica até 30 dias como assídua', () => expect(clientCategory(30, 1)).toBe('assidua'));
  it('classifica 31 até 60 dias como pouco frequente', () => { expect(clientCategory(31, 1)).toBe('pouco_frequente'); expect(clientCategory(60, 1)).toBe('pouco_frequente'); });
  it('classifica acima de 60 dias como afastada', () => expect(clientCategory(61, 1)).toBe('afastada'));
  it('classifica mais de 10 visitas como VIP', () => { expect(clientCategory(20, 10)).toBe('assidua'); expect(clientCategory(90, 11)).toBe('vip'); });
  it('calcula sinal de 30% sobre serviço de 300', () => expect(depositAmount(300, 'porcentagem', 30)).toBe(90));
  it('calcula sinal de valor fixo sem ultrapassar o preço do serviço', () => { expect(depositAmount(300, 'fixo', 50)).toBe(50); expect(depositAmount(100, 'fixo', 150)).toBe(100); });
  it('rejeita sinal com valores inválidos', () => { expect(() => depositAmount(300, 'porcentagem', 101)).toThrow(); expect(() => depositAmount(-1, 'fixo', 10)).toThrow(); });
  it('gera payload PIX válido com valor e chave do salão', () => { const p = buildPixPayload('11999990000', 'Studio Ana', 'São Paulo', 90, 'abc123'); expect(p).toContain('BR.GOV.BCB.PIX'); expect(p).toContain('11999990000'); expect(p).toContain('540590.00'); expect(p).toContain('STUDIO ANA'); expect(p.slice(-4)).toMatch(/^[0-9A-F]{4}$/); });
  it('rejeita payload PIX sem chave ou sem valor', () => { expect(() => buildPixPayload('', 'Ana', 'SP', 10, 'x')).toThrow(); expect(() => buildPixPayload('11999990000', 'Ana', 'SP', 0, 'x')).toThrow(); });
});
describe('Horários livres da agenda mensal', () => {
  it('lista os horários das 09h às 17h quando não há agendamentos', () => {
    expect(freeSlots([])).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);
  });
  it('remove as horas já agendadas', () => {
    expect(freeSlots([9, 14])).toEqual(['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00']);
  });
  it('retorna vazio quando o dia está lotado', () => {
    expect(freeSlots([9, 10, 11, 12, 13, 14, 15, 16, 17])).toEqual([]);
  });
});

describe('Horário de funcionamento personalizado', () => {
  it('respeita abertura e fechamento definidos pelo dono', () => {
    expect(freeSlots([], 8, 12)).toEqual(['08:00', '09:00', '10:00', '11:00']);
  });
});

describe('Funcionamento até meia-noite', () => {
  it('gera horários das 08h às 23h quando o fechamento é 00:00 (24h)', () => {
    const slots = freeSlots([], 8, 24);
    expect(slots[0]).toBe('08:00');
    expect(slots[slots.length - 1]).toBe('23:00');
    expect(slots).toHaveLength(16);
  });
});
