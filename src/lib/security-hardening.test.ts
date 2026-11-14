import { describe, expect, it } from 'vitest';
import { csvCell } from './csv-security';
import { salonMessageSchema } from './message-security';

describe('safe spreadsheet exports', () => {
  it.each(['=1+1', '+SUM(A1)', '-1+1', '@SUM(A1)', '  =1+1', '\t=1+1', '\r=1+1', '\n=1+1'])('neutralizes %j', value => {
    expect(csvCell(value)).toBe(`"'${value}"`);
  });
  it('quotes delimiters, quotes and newlines as one cell', () => {
    expect(csvCell('Salão; "A"\nB')).toBe('"Salão; ""A""\nB"');
  });
  it('preserves negative monetary values', () => {
    expect(csvCell(-100)).toBe('"-100"');
  });
});
describe('message validation', () => {
  const base = { salonId: '11111111-1111-4111-8111-111111111111', phone: ' (11) 99999-9999 ', body: ' Olá! ' };
  it('normalizes phone and trims message', () => {
    expect(salonMessageSchema.parse(base)).toEqual({ ...base, phone: '5511999999999', body: 'Olá!' });
  });
  it('rejects messages above 4000 characters', () => {
    expect(salonMessageSchema.safeParse({ ...base, body: 'a'.repeat(4001) }).success).toBe(false);
  });
  it('rejects blank messages', () => {
    expect(salonMessageSchema.safeParse({ ...base, body: ' ' }).success).toBe(false);
  });
  it('rejects invalid phones', () => {
    expect(() => salonMessageSchema.parse({ ...base, phone: '123' })).toThrow();
  });
});