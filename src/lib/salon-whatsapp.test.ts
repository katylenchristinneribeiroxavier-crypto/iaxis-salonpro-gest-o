import { describe, expect, it } from 'vitest';
import { maskSalonWhatsapp, salonWhatsappLink } from './salon-whatsapp';
describe('WhatsApp individual do salão', () => {
  it('mantém o destino vazio quando a dona não configurou número', () => {
    expect(salonWhatsappLink('', 'Agendamento')).toBeNull();
  });
  it('usa o número de cada salão, sem destino compartilhado', () => {
    expect(salonWhatsappLink('11999999999', 'Agendamento')).toBe('https://wa.me/5511999999999?text=Agendamento');
    expect(salonWhatsappLink('21988888888', 'Agendamento')).toBe('https://wa.me/5521988888888?text=Agendamento');
  });
  it('formata DDD e celular no padrão solicitado', () => {
    expect(maskSalonWhatsapp('11999999999')).toBe('(11) 99999-9999');
    expect(maskSalonWhatsapp('')).toBe('');
  });
});