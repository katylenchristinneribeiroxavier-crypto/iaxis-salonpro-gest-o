import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { evolutionBaseUrl, evolutionPairing, evolutionPhone, managedEvolutionInstance } from './evolution';

export const getPlatformEvolution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'super_admin' });
  if (role.error || !role.data) throw new Error('Acesso exclusivo da desenvolvedora master.');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const [config, salons, logs] = await Promise.all([
    db.from('platform_evolution_settings').select('api_url, callback_origin, enabled, verified_at').eq('id', true).maybeSingle(),
    db.from('configuracoes_salao').select('salon_id, nome_salao, whatsapp_salao, evolution_managed, evolution_connection_state, evolution_webhook_enabled, evolution_last_received_at'),
    context.supabase.from('platform_automation_audit').select('*').order('performed_at', { ascending: false }).limit(20),
  ]);
  if (config.error || salons.error || logs.error) throw new Error('Não foi possível consultar as automações.');
  return { config: config.data, salons: salons.data, logs: logs.data, signingReady: Boolean(process.env['EVOLUTION_WEBHOOK_SIGNING_KEY']) };
});

export const savePlatformEvolution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().max(500), token: z.string().trim().max(2000), callbackOrigin: z.string().url(), enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'super_admin' });
    if (role.error || !role.data) throw new Error('Acesso exclusivo da desenvolvedora master.');
    const url = evolutionBaseUrl(data.url);
    const callback = new URL(evolutionBaseUrl(data.callbackOrigin));
    if (callback.pathname !== '/') throw new Error('Informe somente o endereço público do app, sem caminho.');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const current = await db.from('platform_evolution_settings').select('api_key').eq('id', true).maybeSingle();
    if (current.error) throw new Error('Não foi possível consultar a configuração.');
    const key = data.token || current.data?.api_key;
    if (!key) throw new Error('Informe a chave global da Evolution.');
    if (!process.env['EVOLUTION_WEBHOOK_SIGNING_KEY']) throw new Error('Segurança do recebimento não configurada.');
    const { evolutionRequest } = await import('./evolution.server');
    // Confirm global API access without returning instance lists or provider credentials.
    await evolutionRequest(url, key, '/instance/fetchInstances');
    const saved = await db.from('platform_evolution_settings').upsert({ id: true, api_url: url, api_key: key, callback_origin: callback.origin, enabled: data.enabled, verified_at: new Date().toISOString(), updated_at: new Date().toISOString(), updated_by: context.userId });
    if (saved.error) throw new Error('Não foi possível salvar a configuração central.');
    const audit = await db.from('platform_automation_audit').insert({ action: data.enabled ? 'Evolution central validada e habilitada' : 'Evolution central desabilitada', performed_by: context.userId });
    if (audit.error) throw new Error('Configuração salva; histórico indisponível.');
    return { saved: true };
  });

export const pairSalonEvolution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ phone: z.string().regex(/^\d{10,11}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const salon = await context.supabase.from('salons').select('id, name').eq('owner_id', context.userId).single();
    if (salon.error || !salon.data) throw new Error('Cadastre seu salão primeiro.');
    const access = await context.supabase.rpc('owns_salon', { _salon: salon.data.id });
    if (access.error || !access.data) throw new Error('Salão sem acesso à conexão.');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const platform = await db.from('platform_evolution_settings').select('*').eq('id', true).single();
    if (platform.error || !platform.data?.enabled || !platform.data.verified_at) throw new Error('A desenvolvedora ainda precisa ativar a conexão central.');
    const p = platform.data;
    const instance = managedEvolutionInstance(salon.data.id);
    const saved = await db.from('configuracoes_salao').upsert({ user_id: context.userId, salon_id: salon.data.id, nome_salao: salon.data.name, whatsapp_salao: data.phone, evolution_instance: instance, evolution_managed: true }, { onConflict: 'user_id' });
    if (saved.error) throw new Error('Não foi possível preparar a conexão do salão.');
    const { evolutionRequest, setupEvolutionWebhook } = await import('./evolution.server');
    let state: Record<string, unknown>;
    try { state = await evolutionRequest(p.api_url, p.api_key, `/instance/connectionState/${instance}`); }
    catch (error) {
      if (!(error instanceof Error) || !('status' in error) || error.status !== 404) throw error;
      try { await evolutionRequest(p.api_url, p.api_key, '/instance/create', { instanceName: instance, integration: 'WHATSAPP-BAILEYS', qrcode: true, number: evolutionPhone(data.phone) }); }
      catch (createError) {
        // Reconcile concurrent creation or an uncertain response before retrying.
        try { await evolutionRequest(p.api_url, p.api_key, `/instance/connectionState/${instance}`); } catch { throw createError; }
      }
      state = await evolutionRequest(p.api_url, p.api_key, `/instance/connectionState/${instance}`);
    }
    await setupEvolutionWebhook(p.api_url, p.api_key, instance, salon.data.id, p.callback_origin);
    const value = z.object({ instance: z.object({ state: z.string() }) }).parse(state).instance.state;
    const pairing = value === 'open' ? { qrImage: '', qrText: '', pairingCode: '' } : evolutionPairing(await evolutionRequest(p.api_url, p.api_key, `/instance/connect/${instance}`));
    const updated = await db.from('configuracoes_salao').update({ evolution_connection_state: value, evolution_webhook_enabled: true }).eq('salon_id', salon.data.id);
    if (updated.error) throw new Error('Conexão preparada; não foi possível atualizar o estado.');
    return { state: value, ...pairing };
  });

export const checkSalonEvolution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const salon = await context.supabase.from('salons').select('id').eq('owner_id', context.userId).single();
  if (salon.error || !salon.data) throw new Error('Cadastre seu salão primeiro.');
  const access = await context.supabase.rpc('owns_salon', { _salon: salon.data.id });
  if (access.error || !access.data) throw new Error('Sem acesso à conexão.');
  const { resolveEvolutionConfig, evolutionRequest, setupEvolutionWebhook } = await import('./evolution.server');
  const c = await resolveEvolutionConfig(salon.data.id);
  if (!c.evolution_api_url || !c.evolution_api_key || !c.evolution_instance) throw new Error('Conecte seu número primeiro.');
  const result = await evolutionRequest(c.evolution_api_url, c.evolution_api_key, `/instance/connectionState/${encodeURIComponent(c.evolution_instance)}`);
  const state = z.object({ instance: z.object({ state: z.string() }) }).parse(result).instance.state;
  if (c.evolution_managed) await setupEvolutionWebhook(c.evolution_api_url, c.evolution_api_key, c.evolution_instance, salon.data.id, c.callback_origin);
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const updated = await db.from('configuracoes_salao').update({ evolution_connection_state: state, ...(c.evolution_managed ? { evolution_webhook_enabled: true } : {}) }).eq('salon_id', salon.data.id);
  if (updated.error) throw new Error('Não foi possível atualizar a conexão.');
  return { state };
});
async function ownSalonConfig(context: { supabase: any; userId: string }) {
  const salon = await context.supabase.from('salons').select('id').eq('owner_id', context.userId).single();
  if (salon.error || !salon.data) throw new Error('Cadastre seu salão primeiro.');
  const access = await context.supabase.rpc('owns_salon', { _salon: salon.data.id });
  if (access.error || !access.data) throw new Error('Sem acesso à conexão.');
  const { resolveEvolutionConfig } = await import('./evolution.server');
  const c = await resolveEvolutionConfig(salon.data.id);
  if (!c.evolution_api_url || !c.evolution_api_key || !c.evolution_instance) throw new Error('Gere o QR Code e conecte seu WhatsApp primeiro.');
  return { salonId: salon.data.id as string, c };
}

export const testSalonEvolution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { c } = await ownSalonConfig(context);
  if (c.evolution_connection_state !== 'open') throw new Error('Seu WhatsApp ainda não está conectado.');
  if (!c.whatsapp_salao) throw new Error('Informe o número do salão.');
  const { evolutionRequest } = await import('./evolution.server');
  await evolutionRequest(c.evolution_api_url, c.evolution_api_key, `/message/sendText/${encodeURIComponent(c.evolution_instance)}`, { number: evolutionPhone(c.whatsapp_salao), text: 'Teste do IAxis SalonPRO: seu WhatsApp está conectado! ✅', linkPreview: false });
  return { sent: true };
});

export const disconnectSalonEvolution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { salonId, c } = await ownSalonConfig(context);
  const { evolutionRequest } = await import('./evolution.server');
  try { await evolutionRequest(c.evolution_api_url, c.evolution_api_key, `/instance/logout/${encodeURIComponent(c.evolution_instance)}`, undefined, 'DELETE'); }
  catch (error) { if (!(error instanceof Error) || !('status' in error) || (error.status !== 404 && error.status !== 400)) throw error; }
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const updated = await db.from('configuracoes_salao').update({ evolution_connection_state: 'close' }).eq('salon_id', salonId);
  if (updated.error) throw new Error('Desconectado; não foi possível atualizar o estado.');
  return { state: 'close' };
});
