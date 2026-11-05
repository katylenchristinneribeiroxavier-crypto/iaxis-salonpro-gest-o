import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Save, ShieldCheck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformEvolution, savePlatformEvolution } from '@/lib/platform-evolution.functions';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { PageTitle, inputCls, Stat } from './Shell';

export function PlatformAutomations() {
  const get = useServerFn(getPlatformEvolution);
  const save = useServerFn(savePlatformEvolution);
  const qc = useQueryClient();
  const { data, error, isPending } = useQuery({ queryKey: ['platform-automations'], queryFn: () => get() });
  const [url, setUrl] = useState('');
  const [origin, setOrigin] = useState('');
  const [token, setToken] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data?.config) { setUrl(data.config.api_url); setOrigin(data.config.callback_origin); setEnabled(data.config.enabled); }
  }, [data]);
  return <>
    <PageTitle title="Central de automações" />
    {error && <p role="alert" className="text-destructive">Não foi possível consultar a central.</p>}
    {isPending ? <p>Carregando…</p> : <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Evolution central" value={data?.config?.enabled ? 'Ativada' : 'Não ativada'} />
        <Stat label="Salões conectados" value={String(data?.salons.filter(s => s.evolution_connection_state === 'open').length ?? 0)} />
        <Stat label="Recebimento protegido" value={data?.signingReady ? 'Configurado' : 'Pendente'} />
      </div>
      <section className="mt-8 border-t pt-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl"><ShieldCheck className="text-gold" />Configuração da desenvolvedora</h2>
        <form className="max-w-2xl space-y-5" onSubmit={async e => {
          e.preventDefault(); setBusy(true);
          try { await save({ data: { url, token, callbackOrigin: origin, enabled } }); setToken(''); toast.success('Conexão central validada e salva'); await qc.invalidateQueries({ queryKey: ['platform-automations'] }); }
          catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível salvar.'); }
          finally { setBusy(false); }
        }}>
          <label className="block text-sm">URL central da Evolution<input className={`${inputCls} mt-2`} required type="url" value={url} onChange={e => setUrl(e.target.value)} /></label>
          <label className="block text-sm">Chave global da Evolution<input className={`${inputCls} mt-2`} type="password" autoComplete="new-password" required={!data?.config} placeholder={data?.config ? 'Manter a chave salva' : ''} value={token} onChange={e => setToken(e.target.value)} /></label>
          <label className="block text-sm">Endereço publicado do aplicativo<input className={`${inputCls} mt-2`} required type="url" value={origin} onChange={e => setOrigin(e.target.value)} /></label>
          <label className="flex items-center gap-3 text-sm"><Switch checked={enabled} onCheckedChange={setEnabled} />Disponível para novas conexões dos salões</label>
          <Button disabled={busy} type="submit"><Save />{busy ? 'Validando…' : 'Salvar e testar central'}</Button>
        </form>
      </section>
      <section className="mt-8 border-t pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl"><MessageCircle className="text-gold" />Conexões dos salões</h2>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground">{['Salão', 'WhatsApp', 'Conexão', 'Recebimento', 'Último evento'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{data?.salons.map(s => <tr className="border-b" key={s.salon_id}><td className="p-3">{s.nome_salao || 'Nome não informado'}</td><td className="p-3">{s.whatsapp_salao || 'Não informado'}</td><td className="p-3">{s.evolution_connection_state === 'open' ? 'Conectado' : 'Aguardando conexão'}</td><td className="p-3">{s.evolution_webhook_enabled ? 'Configurado' : 'Pendente'}</td><td className="p-3">{s.evolution_last_received_at ? new Date(s.evolution_last_received_at).toLocaleString('pt-BR') : '—'}</td></tr>)}</tbody></table></div>
        {!data?.salons.length && <p className="py-4 text-muted-foreground">Nenhum salão conectado.</p>}
      </section>
      <section className="mt-8 border-t pt-6"><h2 className="mb-4 text-xl">Serviços</h2><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt>Mensagens WhatsApp</dt><dd className="text-muted-foreground">{data?.config?.enabled ? 'Disponíveis após confirmação de cada número' : 'Aguardando Evolution central'}</dd></div><div><dt>Planos e qualificação de leads com IA</dt><dd className="text-muted-foreground">Disponíveis no painel do revendedor</dd></div><div><dt>Recebimentos PIX</dt><dd className="text-muted-foreground">Confirmação manual pela dona do salão</dd></div><div><dt>Assistente WhatsApp 24h e lembretes</dt><dd className="text-muted-foreground">Ainda não ativados</dd></div></dl></section>
      <section className="mt-8 border-t pt-6"><h2 className="mb-4 text-xl">Histórico da central</h2>{data?.logs.map(l => <p className="mb-3 text-sm" key={l.id}>{new Date(l.performed_at).toLocaleString('pt-BR')} · {l.action}</p>)}</section>
    </>}
  </>;
}