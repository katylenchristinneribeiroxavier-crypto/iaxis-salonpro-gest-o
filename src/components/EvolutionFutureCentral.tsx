import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { inputCls } from '@/components/Shell';
import { Button } from '@/components/ui/button';

export function EvolutionFutureCentral() {
  const qc = useQueryClient();
  const config = useQuery({ queryKey: ['evolution-global'], queryFn: async () => { const r = await supabase.from('evolution_config_global').select('*').order('criado_em').limit(1).maybeSingle(); if (r.error) throw r.error; return r.data; } });
  const salons = useQuery({ queryKey: ['evolution-salons'], queryFn: async () => { const r = await supabase.from('salons').select('id, name, evolution_instance_name, evolution_conectado').order('created_at'); if (r.error) throw r.error; return r.data; } });
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  useEffect(() => { if (config.data) { setUrl(config.data.evolution_url); setKey(config.data.evolution_api_key_global); } }, [config.data]);

  async function salvar() {
    const r = config.data
      ? await supabase.from('evolution_config_global').update({ evolution_url: url.trim(), evolution_api_key_global: key.trim() }).eq('id', config.data.id)
      : await supabase.from('evolution_config_global').insert({ evolution_url: url.trim(), evolution_api_key_global: key.trim() });
    if (r.error) toast.error('Não foi possível salvar.'); else { toast.success('Configuração salva (modo simulação)'); qc.invalidateQueries({ queryKey: ['evolution-global'] }); }
  }
  async function gerar(id: string) {
    const r = await supabase.rpc('master_gerar_instancia_futura', { _salon: id });
    if (r.error) toast.error(r.error.message); else { toast.success(`Instância: ${r.data}`); qc.invalidateQueries({ queryKey: ['evolution-salons'] }); }
  }

  return <section className="mt-12 border-t pt-8">
    <h2 className="text-2xl">Central Evolution (Futura)</h2>
    <p className="mt-1 text-sm text-muted-foreground">Modo: {config.data?.ativo ? 'ativo' : 'simulação — nenhuma mensagem é enviada'}</p>
    <div className="my-5 grid max-w-xl gap-3">
      <label className="text-sm">URL da Evolution<input className={`${inputCls} mt-2`} value={url} maxLength={500} onChange={e => setUrl(e.target.value)} placeholder="https://" /></label>
      <label className="text-sm">API Key Global<input type="password" className={`${inputCls} mt-2`} value={key} maxLength={500} onChange={e => setKey(e.target.value)} /></label>
      <Button className="w-fit" onClick={salvar}>Salvar</Button>
    </div>
    {salons.isPending ? <p>Carregando salões…</p> : !salons.data?.length ? <p className="text-muted-foreground">Nenhum salão cadastrado.</p> :
      <ul className="divide-y">{salons.data.map(s => <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><p>{s.name || 'Salão sem nome'}</p><p className="text-sm text-muted-foreground">{s.evolution_conectado ? 'Conectado' : 'Desconectado'} · Instância: {s.evolution_instance_name || '—'}</p></div>
        <Button variant="outline" size="sm" disabled={!!s.evolution_instance_name} onClick={() => gerar(s.id)}>Gerar Instância Futura</Button>
      </li>)}</ul>}
  </section>;
}
