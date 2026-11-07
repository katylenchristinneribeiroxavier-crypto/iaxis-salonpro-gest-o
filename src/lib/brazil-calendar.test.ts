import { describe, expect, it } from 'vitest';
import { brazilCalendar, specialMessageKey } from './brazil-calendar';
import { brasiliaDate } from './automatic-finance';
const date = (year: number, key: string) => brazilCalendar(year).find(e => e.key === key)?.date;
describe('Calendário brasileiro contínuo', () => {
  it('Páscoa móvel de 2026 é 5 de abril', () => expect(date(2026, 'pascoa')).toBe('2026-04-05'));
  it('Páscoa móvel de 2027 é 28 de março', () => expect(date(2027, 'pascoa')).toBe('2027-03-28'));
  it('Carnaval de 2026 é 17 de fevereiro e não feriado nacional', () => { expect(date(2026, 'carnaval')).toBe('2026-02-17'); expect(brazilCalendar(2026).find(e => e.key === 'carnaval')?.kind).toBe('Ponto facultativo federal'); });
  it('Dia das Mães segue o segundo domingo de maio', () => { expect(date(2026, 'maes')).toBe('2026-05-10'); expect(date(2027, 'maes')).toBe('2027-05-09'); });
  it('Dia dos Namorados brasileiro é 12 de junho', () => expect(date(2027, 'namorados')).toBe('2027-06-12'));
  it('Mulher é comemorativa em 8 de março', () => { const e = brazilCalendar(2026).find(e => e.key === 'mulher'); expect(e?.date).toBe('2026-03-08'); expect(e?.kind).toBe('Data comemorativa'); });
  it('Natal e recomeço ficam em dezembro e janeiro', () => { expect(date(2027, 'natal')).toBe('2027-12-25'); expect(date(2027, 'ano-novo')).toBe('2027-01-01'); });
  it('data muda somente na meia-noite de Brasília', () => { expect(brasiliaDate(new Date('2027-01-01T02:59:59Z'))).toBe('2026-12-31'); expect(brasiliaDate(new Date('2027-01-01T03:00:00Z'))).toBe('2027-01-01'); });
  it('deduplicação separa cliente, salão e ciclo anual', () => { const e = brazilCalendar(2026).find(e => e.key === 'natal'); if (!e) throw new Error('Data ausente'); expect(specialMessageKey('s1', 'c1', e)).toBe('special:s1:c1:2026-12-25:natal'); expect(specialMessageKey('s2', 'c1', e)).not.toBe(specialMessageKey('s1', 'c1', e)); });
});