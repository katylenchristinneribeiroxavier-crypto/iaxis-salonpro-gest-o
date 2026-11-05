import { describe, expect, it } from 'vitest';
import { evolutionBaseUrl, evolutionPhone, advanceMessageStatus, parseEvolutionMessage, managedEvolutionInstance, evolutionPairing } from './evolution';
describe('Evolution por salão', () => {
  it('cria uma conexão central exclusiva e estável para cada salão', () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';
    expect(managedEvolutionInstance(first)).toBe(`iaxis-${first}`);
    expect(managedEvolutionInstance(first)).not.toBe(managedEvolutionInstance(second));
    expect(managedEvolutionInstance(first)).toBe(managedEvolutionInstance(first));
  });
  it('não trata só o número como conexão autorizada', () => {
    expect(evolutionPairing({ number: '5511999999999' })).toEqual({ qrImage: '', qrText: '', pairingCode: '' });
    expect(evolutionPairing({ base64: 'https://untrusted.example/image', pairingCode: '12345678' }).qrImage).toBe('');
    expect(evolutionPairing({ qrcode: { base64: 'data:image/png;base64,YWJj' } }).qrImage).toBe('data:image/png;base64,YWJj');
  });
  it('recusa endereços locais e conexões sem HTTPS', () => {
    expect(() => evolutionBaseUrl('http://example.com')).toThrow();
    expect(() => evolutionBaseUrl('https://127.0.0.1')).toThrow();
    expect(() => evolutionBaseUrl('https://localhost')).toThrow();
    expect(evolutionBaseUrl('https://evolution.example.com/')).toBe('https://evolution.example.com');
  });
  it('envia para o WhatsApp da cliente informado, sem número fixo', () => {
    expect(evolutionPhone('(11) 99999-9999')).toBe('5511999999999');
    expect(evolutionPhone('5521988888888')).toBe('5521988888888');
    expect(() => evolutionPhone('')).toThrow();
  });
  it('não regride confirmação de leitura ou entrega', () => {
    expect(advanceMessageStatus('read', 'sent')).toBe('read');
    expect(advanceMessageStatus('delivered', 'failed')).toBe('delivered');
    expect(advanceMessageStatus('accepted', 'delivered')).toBe('delivered');
  });
  it('separa remetente recebido e ignora grupos', () => {
    expect(parseEvolutionMessage({ key: { id: 'msg1', remoteJid: '5511999999999@s.whatsapp.net', fromMe: false }, message: { conversation: 'Quero agendar' } })?.phone).toBe('5511999999999');
    expect(parseEvolutionMessage({ key: { id: 'msg2', remoteJid: 'group@g.us' } })).toBeNull();
  });
});