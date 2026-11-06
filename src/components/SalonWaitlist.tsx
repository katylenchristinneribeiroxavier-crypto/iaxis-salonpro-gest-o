import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { linkWhatsApp } from '@/lib/whatsapp-confirmacao';
import { mensagemVagaAberta, CANCEL_MIN_HOURS_PADRAO } from '@/lib/cancelamento';
import { inputCls } from './Shell';
import { Button } from './ui/button';

const LABEL: Record<string, string> = { aguardando: 'Aguardando vaga', notificado: 'Vaga avisada', agendado: 'Agendou', removido: 'Removida' };

export function SalonWaitlist() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions); const qc = useQueryClient();
  const salonId = ctx.salon?.id;
  const rules = useQuery({ queryKey: ['booking-rules', salonId], enabled: !!salonId, queryFn: async () => (await supabase.from('salon_booking_rules').select('cancel_min_hours').eq('salon_id', salonId!).maybeSingle()).data });
  const lista = useQuery({ queryKey: ['lista-espera', salonId], enabled: !!salonId && ctx.manager, queryFn: async () => { const r = await supabase.from('lista_espera').select('*').eq('salon_id', salonId!).neq('status', 'removido').order('desired_at').order('created_at'); if (r.error) throw r.error; return r.data; } });
  const [horas, setHoras] = useState(String(CANCEL_MIN_HOURS_PADRAO));
  useEffect(() => { if (rules.data) setHoras(String(rules.data.cancel_min_hours)); }, [rules.data]);
  if (!salonId || !ctx.manager) return null;

  const salvar = async () => {
    const n = Number(horas); if (!Number.isInteger(n) || n < 0 || n > 168) return void toast.error('Use de 0 a 168 horas');
    const r = await supabase.from('salon_booking_rules').upsert({ salon_id: salonId, cancel_min_hours: n, updated_at: new Date().toISOString() });
    if (r.error) return void toast.error(r.error.message);
    await qc.invalidateQueries({ queryKey: ['booking-rules'] }); toast.success('Tempo de cancelamento salvo');
  };
  const setStatus = async (id: string, status: string) => { const r = await supabase.from('lista_espera').update({ status }).eq('id', id); if (r.error) return void toast.error(r.error.message); await qc.invalidateQueries({ queryKey: ['lista-espera'] }); };
  const avisar = (w: { id: string; whatsapp: string; desired_at: string }) => { const url = linkWhatsApp(w.whatsapp, mensagemVagaAberta(ctx.salon?.name, w.desired_at)); if (url) window.open(url, '_blank', 'noopener'); };

  return <section className="mt-10 space-y-6 border-t pt-8">
    <div className="rounded-lg border bg-card p-5">
      <h2 className="text-2xl">Regra de cancelamento</h2>
      <p className="mt-1 text-sm text-muted-foreground">A cliente só pode cancelar pela página de reserva com esta antecedência. Ao cancelar, o horário volta para a agenda e a primeira da lista de espera é avisada.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2"><input aria-label="Horas de antecedência" type="number" min={0} max={168} className={`${inputCls} max-w-28`} value={horas} onChange={e => setHoras(e.target.value)} /><span className="text-sm">horas antes</span><Button size="sm" onClick={salvar}>Salvar</Button></div>
    </div>
    <div>
      <h2 className="text-2xl">Lista de espera</h2>
      <div className="mt-3 space-y-2">{lista.data?.map(w => <article key={w.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
        <p className="font-display text-xl text-gold">{new Date(w.desired_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
        <div className="min-w-40 flex-1"><p>{w.client_name}</p><p className="text-sm text-muted-foreground">{w.whatsapp}</p></div>
        <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">{LABEL[w.status] ?? w.status}</span>
        <Button size="sm" variant="outline" onClick={() => avisar(w)}><MessageCircle />Enviar WhatsApp</Button>
        {w.status !== 'agendado' && <Button size="sm" variant="ghost" onClick={() => setStatus(w.id, 'agendado')}>Agendou</Button>}
        <Button size="sm" variant="ghost" aria-label="Remover da lista" onClick={() => setStatus(w.id, 'removido')}><Trash2 /></Button>
      </article>)}
      {lista.data?.length === 0 && <p className="py-4 text-muted-foreground">Ninguém na lista de espera.</p>}</div>
    </div>
  </section>;
}
