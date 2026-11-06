import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { aceitarTermosLicenca } from '@/lib/license.functions';
import { TermosELGPD } from './TermosELGPD';
import { Button } from './ui/button';

export function SalonLicense({ salon, owner }: { salon: string; owner: boolean }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const accept = useServerFn(aceitarTermosLicenca);
  const query = useQuery({ queryKey: ['salon-license', salon], queryFn: async () => { const r = await supabase.from('licencas_nacionais').select('*').eq('salao_id', salon).maybeSingle(); if (r.error) throw r.error; return r.data; } });
  const license = query.data;
  if (query.isPending) return <p className="mb-5 text-muted-foreground">Carregando licença…</p>;
  if (query.error) return <p role="alert" className="mb-5 text-destructive">Não foi possível consultar a licença.</p>;
  if (!license) return null;
  return <section className="mb-6 border-b pb-5"><h2 className="text-xl">Licença nacional</h2><p className="mt-2 text-sm text-gold">{license.tipo_plano} · {license.status} · Vencimento: {new Date(license.data_expira).toLocaleString('pt-BR')}</p>{license.aceitou_termos ? <p className="mt-3 text-sm text-muted-foreground">Termos aceitos{license.termos_aceitos_em ? ` em ${new Date(license.termos_aceitos_em).toLocaleString('pt-BR')}` : ''}.</p> : owner ? <form onSubmit={async e => { e.preventDefault(); if (!checked) return; setBusy(true); try { await accept({ data: { salon, aceitou: true } }); await qc.invalidateQueries({ queryKey: ['salon-license', salon] }); toast.success('Aceite registrado'); } catch { toast.error('Não foi possível registrar o aceite.'); } finally { setBusy(false); } }}><TermosELGPD checked={checked} onChange={setChecked} disabled={busy} /><Button type="submit" disabled={!checked || busy}>{busy ? 'Registrando…' : 'Registrar aceite'}</Button></form> : <p className="mt-3 text-sm text-muted-foreground">Aceite dos termos pendente pela dona.</p>}</section>;
}