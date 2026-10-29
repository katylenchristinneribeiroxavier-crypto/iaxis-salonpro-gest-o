import { describe, expect, it } from 'vitest';
import { introduction, splitCommission, clientCategory } from './salon-rules';
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
});