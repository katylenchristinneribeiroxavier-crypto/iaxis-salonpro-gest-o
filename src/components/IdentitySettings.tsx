import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Save, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { salonContextOptions } from '@/lib/salon-data';
import { introduction, type AgentGender } from '@/lib/salon-rules';
import { supabase } from '@/integrations/supabase/client';
import { PageTitle, inputCls } from './Shell';
import { Button } from './ui/button';
import { PhotoPicker } from './PhotoPicker';
import { uploadSalonPhoto } from '@/lib/salon-media';
export function IdentitySettings({ secretary = false }: { secretary?: boolean }) {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const salon = ctx.salon;
  const qc = useQueryClient();
  const [name, setName] = useState(''); const [logo, setLogo] = useState('');
  const [color, setColor] = useState(''); const [article, setArticle] = useState('da');
  const [agent, setAgent] = useState(''); const [gender, setGender] = useState<AgentGender>('neutro');
  const [busy, setBusy] = useState(false);
  const { data: config } = useQuery({ queryKey: ['secretary', salon?.id], enabled: !!salon, queryFn: async () => { if (!salon) return null; const r = await supabase.from('config_agente_secretario').select('*').eq('salon_id', salon.id).maybeSingle(); if (r.error) throw r.error; return r.data; } });
  useEffect(() => { if (salon) { setName(salon.name); setLogo(salon.logo_url); setColor(salon.brand_color); setArticle(salon.name_article); } }, [salon]);
  useEffect(() => { setAgent(config?.nome_agente ?? ''); setGender((config?.genero as AgentGender) ?? 'neutro'); }, [config]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!salon || !ctx.manager) return; setBusy(true);
    try {
      const identity = await supabase.rpc('save_salon_identity', { _salon: salon.id, _name: name, _logo: logo, _color: color, _article: article });
      if (identity.error) throw identity.error;
      if (secretary) { const r = await supabase.from('config_agente_secretario').upsert({ salon_id: salon.id, nome_agente: agent.trim(), genero: gender, pronomes: gender === 'masculino' ? 'ele/dele' : gender === 'feminino' ? 'ela/dela' : 'elu/delu' }, { onConflict: 'salon_id' }); if (r.error) throw r.error; }
      await qc.invalidateQueries({ queryKey: ['salon-context'] }); await qc.invalidateQueries({ queryKey: ['secretary'] }); toast.success('Configuração salva');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível salvar'); } finally { setBusy(false); }
  };
  return <><PageTitle title={secretary ? 'Minha secretária virtual' : 'Configuração do salão'} />
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">Nome do salão<input aria-label="Nome do salão" className={`${inputCls} mt-2`} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block text-sm">Tratamento do nome<select aria-label="Tratamento do nome" className={`${inputCls} mt-2`} value={article} onChange={e => setArticle(e.target.value)}><option value="da">da</option><option value="do">do</option><option value="de">de</option></select></label>
      </div>
      {!secretary && salon && <div className="space-y-3 text-sm"><p>Foto da dona</p>{salon.foto_dona_url && <img src={salon.foto_dona_url} alt="Foto da dona" className="h-24 w-24 rounded-full object-cover" />}<PhotoPicker label="Abrir Câmera" facing="user" onFile={async f => { try { const url = await uploadSalonPhoto(salon.id, 'dona', f); const r = await supabase.rpc('save_owner_photo', { _salon: salon.id, _url: url }); if (r.error) throw r.error; await qc.invalidateQueries({ queryKey: ['salon-context'] }); toast.success('Foto da dona salva'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Falha no envio'); } }} /></div>}
      {!secretary && <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-3 text-sm sm:col-span-2"><p>Logo / foto do salão</p>{logo && <img src={logo} alt="Logo do salão" className="h-24 w-24 rounded-xl object-cover" />}<PhotoPicker label="Abrir Câmera" onFile={async f => { if (!salon) return; try { setLogo(await uploadSalonPhoto(salon.id, 'logo', f)); toast.success('Foto enviada. Clique em Salvar configuração.'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Falha no envio'); } }} /></div><label className="text-sm">Cor da marca<input aria-label="Cor da marca" type="color" className="mt-2 block h-10 w-20" value={color} onChange={e => setColor(e.target.value)} /></label></div>}
      {secretary && <><label className="block text-sm">Nome do agente<input aria-label="Nome do agente" className={`${inputCls} mt-2`} value={agent} onChange={e => setAgent(e.target.value)} /></label>
        <fieldset><legend className="mb-3 text-sm">Gênero e pronomes</legend><div className="flex flex-wrap gap-5">{(['feminino','masculino','neutro'] as const).map(g => <label key={g} className="flex items-center gap-2 text-sm"><input type="radio" name="gender" value={g} checked={gender===g} onChange={() => setGender(g)} />{g === 'feminino' ? 'Feminino · ela/dela' : g === 'masculino' ? 'Masculino · ele/dele' : 'Neutro · elu/delu'}</label>)}</div></fieldset>
        <section className="border-t pt-6"><h2 className="text-2xl">Apresentação</h2><div className="mt-4 flex items-start gap-3"><UserRound className="mt-1 h-6 w-6 shrink-0 text-gold" /><p aria-live="polite" data-testid="introduction" className="text-lg leading-relaxed">{introduction(agent, name, agent ? gender : undefined, article)}</p></div></section>
      </>}
      <Button disabled={busy} type="submit"><Save />{busy ? 'Salvando…' : 'Salvar configuração'}</Button>
    </form>
  </>;
}