import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Save, PlugZap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle, inputCls } from './Shell';
import { Button } from './ui/button';

export function WhatsappSettings() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [instance, setInstance] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const { data } = useQuery({
    queryKey: ['whatsapp-config', ctx.salon?.id],
    enabled: !!ctx.salon,
    queryFn: async () => {
      if (!ctx.salon) return null;
      const [config, connection] = await Promise.all([
        supabase.from('configuracoes_salao').select('evolution_api_url, evolution_api_key').eq('user_id', ctx.userId).maybeSingle(),
        supabase.from('salon_connections').select('evolution_instance').eq('salon_id', ctx.salon.id).maybeSingle(),
      ]);
      if (config.error) throw config.error;
      if (connection.error) throw connection.error;
      return { evolution_url: config.data?.evolution_api_url, api_token: config.data?.evolution_api_key, evolution_instance: connection.data?.evolution_instance };
    },
  });

  useEffect(() => {
    setUrl(data?.evolution_url ?? '');
    setInstance(data?.evolution_instance ?? ctx.salon?.id ?? '');
    setToken(data?.api_token ?? '');
  }, [data, ctx.salon?.id]);

  const salvar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!ctx.salon || ctx.salon.owner_id !== ctx.userId) return;
    setBusy(true);
    const config = await supabase.from('configuracoes_salao').upsert({
      user_id: ctx.userId, salon_id: ctx.salon.id, evolution_api_url: url.trim(), evolution_api_key: token.trim(),
    }, { onConflict: 'user_id' });
    if (config.error) { setBusy(false); toast.error(config.error.message); return; }
    const r = await supabase.from('salon_connections').upsert(
      { salon_id: ctx.salon.id, evolution_url: url.trim(), evolution_instance: instance.trim(), api_token: token.trim() },
      { onConflict: 'salon_id' },
    );
    setBusy(false);
    if (r.error) { toast.error(r.error.message); return; }
    toast.success('Configuração salva');
    await qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
  };

  const testar = async (): Promise<void> => {
    if (!url.trim() || !token.trim()) { toast.error('Preencha a URL e o token antes de testar.'); return; }
    setTesting(true);
    try {
      const base = url.trim().replace(/\/+$/, '');
      const r = await fetch(`${base}/instance/connectionState/${encodeURIComponent(instance.trim())}`, {
        headers: { apikey: token.trim() },
      });
      if (r.ok) {
        const body = await r.json().catch(() => null) as { instance?: { state?: string } } | null;
        const state = body?.instance?.state ?? 'desconhecido';
        toast.success(`Conexão OK! Estado da instância: ${state}`);
      } else {
        toast.error(`Falha na conexão (código ${r.status}). Confira a URL, a instância e o token.`);
      }
    } catch {
      toast.error('Não foi possível alcançar a API. Confira a URL.');
    } finally {
      setTesting(false);
    }
  };

  return <>
    <PageTitle title="Conexão WhatsApp" sub="Configure a API do seu WhatsApp (Evolution, Z-API ou Uazapi) para o assistente atender seus clientes" />
    <form className="max-w-2xl space-y-5" onSubmit={salvar}>
      <label className="block text-sm">URL da API
        <input required type="url" aria-label="URL da API" placeholder="https://sua-api.exemplo.com" className={`${inputCls} mt-2`} value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="block text-sm">Instância
        <input aria-label="Instância" placeholder="Nome da instância" className={`${inputCls} mt-2`} value={instance} onChange={(e) => setInstance(e.target.value)} />
      </label>
      <label className="block text-sm">API Key / Token
        <input required type="password" aria-label="API Key ou Token" className={`${inputCls} mt-2`} value={token} onChange={(e) => setToken(e.target.value)} />
      </label>
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}><Save />{busy ? 'Salvando…' : 'Salvar'}</Button>
        <Button type="button" variant="outline" disabled={testing} onClick={testar}><PlugZap />{testing ? 'Testando…' : 'Testar conexão'}</Button>
      </div>
    </form>
    <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
      Recomendamos a <b>Evolution API</b>: nela, a URL é o endereço do seu servidor, a instância é o nome que você criou e o token é a chave de API dela. Depois de salvar e testar, o assistente de WhatsApp poderá responder seus clientes por este número.
    </p>
  </>;
}
