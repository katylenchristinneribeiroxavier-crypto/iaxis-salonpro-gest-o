export type EvolutionGlobalConfig = { evolution_url: string; evolution_api_key_global: string; ativo: boolean };
export type MensagemFutura = { instancia: string; numero: string; mensagem: string };
export type ResultadoEnvio = { modo: 'simulado' | 'real'; ok: boolean; erro?: string };

/** Envia pela Evolution somente quando a configuração global está ativa e completa; caso contrário apenas simula. */
export async function enviarMensagemFuturaCom(config: EvolutionGlobalConfig | null, msg: MensagemFutura, fetcher: typeof fetch = fetch): Promise<ResultadoEnvio> {
  if (!config?.ativo || !config.evolution_url.trim() || !config.evolution_api_key_global.trim() || !msg.instancia) {
    console.log(`Evolution em modo desenvolvimento - mensagem simulada: ${msg.mensagem}`);
    return { modo: 'simulado', ok: true };
  }
  const url = `${config.evolution_url.replace(/\/+$/, '')}/message/sendText/${encodeURIComponent(msg.instancia)}`;
  const res = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.evolution_api_key_global }, body: JSON.stringify({ number: msg.numero.replace(/\D/g, ''), text: msg.mensagem }) });
  return res.ok ? { modo: 'real', ok: true } : { modo: 'real', ok: false, erro: `Evolution respondeu ${res.status}` };
}
