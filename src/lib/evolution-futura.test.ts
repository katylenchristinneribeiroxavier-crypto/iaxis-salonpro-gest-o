import { describe, expect, it, vi } from 'vitest';
import { enviarMensagemFuturaCom } from './evolution-futura';

const msg = { instancia: 'iaxis-1', numero: '+55 11 99999-0000', mensagem: 'Lembrete' };

describe('enviar_mensagem_futura', () => {
  it('simula e não chama a Evolution quando ativo = false', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const f = vi.fn();
    const r = await enviarMensagemFuturaCom({ evolution_url: 'https://x', evolution_api_key_global: 'k', ativo: false }, msg, f as never);
    expect(r.modo).toBe('simulado');
    expect(f).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Evolution em modo desenvolvimento - mensagem simulada: Lembrete');
  });
  it('envia de verdade quando ativo = true com URL e chave', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const r = await enviarMensagemFuturaCom({ evolution_url: 'https://evo.com/', evolution_api_key_global: 'k', ativo: true }, msg, f as never);
    expect(r.modo).toBe('real');
    expect(f.mock.calls[0][0]).toBe('https://evo.com/message/sendText/iaxis-1');
  });
});
