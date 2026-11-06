import { describe, expect, it } from 'vitest';
import { podeCancelar, mensagemVagaAberta } from './cancelamento';

const agora = new Date('2026-11-06T12:00:00Z');
describe('regra de cancelamento', () => {
  it('permite cancelar com exatamente 2 horas de antecedência', () => {
    expect(podeCancelar('2026-11-06T14:00:00Z', agora)).toBe(true);
  });
  it('bloqueia cancelamento com menos de 2 horas', () => {
    expect(podeCancelar('2026-11-06T13:59:00Z', agora)).toBe(false);
  });
  it('respeita o tempo configurado pelo salão', () => {
    expect(podeCancelar('2026-11-06T15:00:00Z', agora, 4)).toBe(false);
  });
  it('monta a mensagem da lista de espera', () => {
    expect(mensagemVagaAberta('Studio', '2026-11-06T17:00:00Z')).toBe('Olá! Abriu vaga no salão Studio no horário 06/11, 14:00 que você queria! Quer agendar?');
  });
});
