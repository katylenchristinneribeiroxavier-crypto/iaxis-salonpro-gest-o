import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Save, PlugZap, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { getEvolutionSettings, saveEvolutionSettings, connectEvolution } from '@/lib/evolution.functions';
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
  const getSettings = useServerFn(getEvolutionSettings);
  const saveSettings = useServerFn(saveEvolutionSettings);
  const connect = useServerFn(connectEvolution);

  const { data } = useQuery({
    queryKey: ['whatsapp-config', ctx.salon?.id, ctx.userId],
    enabled: ctx.salon?.owner_id === ctx.userId,
    queryFn: () => getSettings(),
  });

  useEffect(() => {
    setUrl(data?.evolution_api_url ?? '');
    setInstance(data?.evolution_instance ?? ctx.salon?.id ?? '');
    setToken('');
  }, [data, ctx.salon?.id]);

  const salvar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!ctx.salon || ctx.salon.owner_id !== ctx.userId) return;
    setBusy(true);
    try {
      await saveSettings({ data: { url, instance, token } });
      setToken(''); toast.success('Configuração salva');
      await qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao salvar.'); }
    finally { setBusy(false); }
  };

  const testar = async (): Promise<void> => {
    setTesting(true);
    try {
      const result = await connect({ data: { callbackOrigin: window.location.hostname === 'localhost' ? 'https://id-preview--622f4b9e-289b-53b6-af7a-3ff5229c16ec.lovable.app' : window.location.origin } });
      toast.success(result.state === 'open' ? 'WhatsApp conectado e recebimento configurado' : `Recebimento configurado. Estado: ${result.state}. Conecte o número na Evolution.`);
      await qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível conectar.');
    } finally {
      setTesting(false);
    }
  };

  return <>
    <PageTitle title="WhatsApp · Evolution" />
    {ctx.salon?.owner_id !== ctx.userId ? <p>A conexão deve ser configurada pela dona do salão.</p> : <>
    <form className="max-w-2xl space-y-5" onSubmit={salvar}>
      <label className="block text-sm">URL da API
        <input required type="url" aria-label="URL da API" placeholder="https://sua-api.exemplo.com" className={`${inputCls} mt-2`} value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="block text-sm">Instância
        <input required aria-label="Instância" placeholder="Nome da instância" className={`${inputCls} mt-2`} value={instance} onChange={(e) => setInstance(e.target.value)} />
      </label>
      <label className="block text-sm">API Key / Token
        <input type="password" autoComplete="new-password" placeholder={data ? 'Deixe em branco para manter a chave salva' : 'Chave da sua Evolution'} aria-label="API Key ou Token" className={`${inputCls} mt-2`} value={token} onChange={(e) => setToken(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}><Save />{busy ? 'Salvando…' : 'Salvar'}</Button>
        <Button type="button" variant="outline" disabled={testing || busy || !data} onClick={testar}><PlugZap />{testing ? 'Conectando…' : 'Testar conexão e ativar mensagens'}</Button>
      </div>
    </form>
    <dl className="mt-6 grid max-w-2xl gap-3 border-t pt-5 text-sm"><div><dt className="text-muted-foreground">Conexão</dt><dd>{data?.evolution_connection_state === 'open' ? 'Conectada' : data?.evolution_connection_state || 'Não testada'}</dd></div><div><dt className="text-muted-foreground">Última mensagem recebida</dt><dd>{data?.evolution_last_received_at ? new Date(data.evolution_last_received_at).toLocaleString('pt-BR') : 'Nenhuma mensagem recebida ainda'}</dd></div></dl>
    <Button asChild variant="outline" className="mt-6"><Link to="/mensagens"><MessageCircle />Abrir mensagens</Link></Button>
    </>}
  </>;
}
