import { enviarMensagemFuturaCom, type MensagemFutura } from './evolution-futura';

/** Gatilho único para reservas e lembretes: simula enquanto evolution_config_global.ativo = false. */
export async function enviar_mensagem_futura(msg: MensagemFutura) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('evolution_config_global').select('evolution_url, evolution_api_key_global, ativo').order('criado_em').limit(1).maybeSingle();
  return enviarMensagemFuturaCom(data, msg);
}
