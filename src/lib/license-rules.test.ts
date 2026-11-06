import { describe, expect, it } from 'vitest';
import { verificarLicenca, LICENSE_DAYS, type License } from './license-rules';
const base: License = { data_expira: '2026-11-13T00:00:00Z', status: 'liberado', tipo_plano: 'mensal', ultimo_pagamento: null };
describe('licença nacional', () => {
  it('teste dura sete dias e bloqueia depois', () => {
    expect(LICENSE_DAYS.teste).toBe(7);
    expect(verificarLicenca(base, new Date('2026-11-12T23:59:59Z'))).toBe(true);
    expect(verificarLicenca(base, new Date('2026-11-13T00:00:01Z'))).toBe(false);
  });
  it('mensal bloqueia após 30 dias mesmo pago', () => {
    const l = { ...base, status: 'pago', ultimo_pagamento: '2026-11-06T00:00:00Z' };
    expect(verificarLicenca(l, new Date('2026-12-06T00:00:00Z'))).toBe(true);
    expect(verificarLicenca(l, new Date('2026-12-06T00:00:01Z'))).toBe(false);
  });
  it('anual bloqueia após 365 dias mesmo pago', () => {
    const l = { ...base, status: 'pago', tipo_plano: 'anual', ultimo_pagamento: '2026-11-06T00:00:00Z' };
    expect(verificarLicenca(l, new Date('2027-11-06T00:00:00Z'))).toBe(true);
    expect(verificarLicenca(l, new Date('2027-11-06T00:00:01Z'))).toBe(false);
  });
  it('bloqueio master prevalece sobre pagamento', () => {
    expect(verificarLicenca({ ...base, status: 'bloqueado', ultimo_pagamento: '2026-11-06T00:00:00Z' }, new Date('2026-11-07'))).toBe(false);
  });
  it('pago sem data de pagamento não concede acesso permanente', () => {
    expect(verificarLicenca({ ...base, status: 'pago' }, new Date('2026-11-07'))).toBe(false);
  });
});