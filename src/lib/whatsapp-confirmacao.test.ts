import { describe, expect, it } from 'vitest';
import { linkWhatsApp, waDigits } from './whatsapp-confirmacao';

describe('whatsapp confirmação', () => {
  it('adiciona 55 a números brasileiros com DDD', () => expect(waDigits('(11) 98888-7777')).toBe('5511988887777'));
  it('sem telefone não gera link', () => expect(linkWhatsApp('', 'oi')).toBeNull());
  it('gera link wa.me com texto codificado', () => expect(linkWhatsApp('11988887777', 'Olá SIM')).toBe('https://wa.me/5511988887777?text=Ol%C3%A1%20SIM'));
});
