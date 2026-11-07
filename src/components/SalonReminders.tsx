import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, Save, RefreshCw, Headset, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { refreshSalonReminders } from '@/lib/salon-automation.functions';
import { PageTitle, inputCls, StatusBadge } from './Shell';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

export function SalonReminders() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient(); const refresh = useServerFn(refreshSalonReminders);
  const [prefs, setPrefs] = useState({ appointment_reminders: true, birthday_reminders: false, return_reminders: false, return_days: 60, special_date_messages: false, reminder_24h: true, thank_you_messages: true, intelligent_return: true });
  const [busy, setBusy] = useState(false); const [filter, setFilter] = useState('');
  const { data, isPending, isError } = useQuery({ queryKey: ['salon-reminders', ctx.salon?.id], enabled: !!ctx.salon, refetchInterval: 30000, queryFn: async () => {
    if (!ctx.salon) return null;
    const [p,q,h] = await Promise.all([supabase.from('salon_automation_preferences').select('*').eq('salon_id',ctx.salon.id).maybeSingle(),supabase.from('fila_mensagens_ia').select('*').eq('salon_id',ctx.salon.id).order('agendado_para',{ascending:false}).limit(200),supabase.from('booking_handoffs').select('*').eq('salon_id',ctx.salon.id).order('created_at',{ascending:false})]);
    if (p.error || q.error || h.error) throw new Error('Não foi possível consultar lembretes');
    return { prefs:p.data, queue:q.data, handoffs:h.data };
  } });
  useEffect(() => { if (data?.prefs) setPrefs({ appointment_reminders:data.prefs.appointment_reminders,birthday_reminders:data.prefs.birthday_reminders,return_reminders:data.prefs.return_reminders,return_days:data.prefs.return_days,special_date_messages:data.prefs.special_date_messages,reminder_24h:data.prefs.reminder_24h,thank_you_messages:data.prefs.thank_you_messages,intelligent_return:data.prefs.intelligent_return }); }, [data?.prefs]);
  return <><PageTitle title="Lembretes e atendimento" /><form className="max-w-3xl space-y-5 border-y py-6" onSubmit={async e => {
    e.preventDefault(); if (!ctx.salon) return; setBusy(true);
    try { const r=await supabase.from('salon_automation_preferences').upsert({salon_id:ctx.salon.id,...prefs,updated_at:new Date().toISOString()}); if(r.error)throw r.error; await qc.invalidateQueries({queryKey:['salon-reminders']});toast.success('Preferências salvas'); }catch{toast.error('Não foi possível salvar');}finally{setBusy(false);}
  }}>
    <label className="flex items-center justify-between gap-4"><span>Lembrete de atendimento<span className="block text-sm text-muted-foreground">Uma hora antes</span></span><Switch aria-label="Lembrete de atendimento" checked={prefs.appointment_reminders} onCheckedChange={v=>setPrefs({...prefs,appointment_reminders:v})}/></label>
    {([{key:'reminder_24h',label:'Lembrete 24h antes'},{key:'thank_you_messages',label:'Agradecimento pós-atendimento'},{key:'intelligent_return',label:'Cliente sumida · retorno por serviço'}] as const).map(({key,label})=><label key={key} className="flex items-center justify-between gap-4"><span>{label}</span><Switch aria-label={label} checked={prefs[key]} onCheckedChange={v=>setPrefs({...prefs,[key]:v})}/></label>)}
    <label className="flex items-center justify-between gap-4"><span>Aniversário<span className="block text-sm text-muted-foreground">07:00 · clientes com autorização</span></span><Switch aria-label="Lembrete de aniversário" checked={prefs.birthday_reminders} onCheckedChange={v=>setPrefs({...prefs,birthday_reminders:v})}/></label>
    <label className="flex items-center justify-between gap-4"><span>Convite de retorno<span className="block text-sm text-muted-foreground">09:00 · clientes com autorização</span></span><Switch aria-label="Lembrete de retorno" checked={prefs.return_reminders} onCheckedChange={v=>setPrefs({...prefs,return_reminders:v})}/></label>
    <label className="flex items-center justify-between gap-4"><span>Mensagens de datas especiais<span className="block text-sm text-muted-foreground">09:00 · Brasília · clientes com autorização</span></span><Switch aria-label="Mensagens de datas especiais" checked={prefs.special_date_messages} onCheckedChange={v=>setPrefs({...prefs,special_date_messages:v})}/></label>
    <label className="block text-sm">Dias sem visita para retorno<input aria-label="Dias para retorno" type="number" required min={1} max={365} value={prefs.return_days} onChange={e=>setPrefs({...prefs,return_days:Number(e.target.value)})} className={`${inputCls} mt-2 max-w-40`}/></label>
    <p className="text-sm text-muted-foreground">Horário local: {ctx.salon?.timezone}. Envios externos aguardam ativação pela desenvolvedora e conexão do WhatsApp.</p><Button disabled={busy} type="submit"><Save/>Salvar preferências</Button>
  </form>
  <section className="mt-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-2xl"><Bell className="text-gold"/>Mensagens programadas</h2><Button variant="outline" disabled={busy} onClick={async()=>{if(!ctx.salon)return;setBusy(true);try{await refresh({data:{salonId:ctx.salon.id}});await qc.invalidateQueries({queryKey:['salon-reminders']});toast.success('Fila atualizada, sem envio externo');}catch{toast.error('Não foi possível atualizar');}finally{setBusy(false);}}}><RefreshCw/>Atualizar fila</Button></div>
    <select aria-label="Filtrar lembretes" value={filter} onChange={e=>setFilter(e.target.value)} className={`${inputCls} my-4 max-w-56`}><option value="">Todos</option><option value="aguardando_conexao_whatsapp">Aguardando conexão WhatsApp</option><option value="pendente">Programados</option><option value="enviado">Aceitos pela API</option><option value="nao_enviado">Não enviados</option><option value="verificar">Verificar envio</option><option value="cancelado">Cancelados</option></select>
    {isPending && <p>Carregando…</p>}{isError && <p role="alert">Não foi possível carregar os lembretes.</p>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground">{['Quando','Mensagem','Status','WhatsApp'].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{data?.queue.filter(q=>!filter||q.status===filter).map(q=><tr className="border-b" key={q.id}><td className="p-3 whitespace-nowrap">{new Date(q.agendado_para).toLocaleString('pt-BR',{timeZone:ctx.salon?.timezone})}</td><td className="min-w-64 p-3">{q.mensagem}{q.error&&<p className="mt-1 text-xs text-muted-foreground">{q.error}</p>}</td><td className="p-3"><StatusBadge s={q.status==='pendente'?'Programado':q.status==='enviado'?'Aceito pela API':q.status}/></td><td className="p-3">{q.cliente_whatsapp||'Somente no app'}</td></tr>)}</tbody></table></div>{!data?.queue.length&&!isPending&&<p className="py-6 text-muted-foreground">Nenhum lembrete programado.</p>}
  </section>
  <section className="mt-8 border-t pt-6"><h2 className="flex items-center gap-2 text-2xl"><Headset className="text-gold"/>Solicitações para a dona</h2>{data?.handoffs.map(h=><article className="mt-4 border-b pb-4" key={h.id}><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{new Date(h.created_at).toLocaleString('pt-BR')}</span><StatusBadge s={h.status}/></div><p className="my-3 whitespace-pre-wrap">{h.message}</p>{h.status==='pendente'&&<Button size="sm" variant="outline" onClick={async()=>{const r=await supabase.from('booking_handoffs').update({status:'resolvido'}).eq('id',h.id);if(r.error)toast.error('Não foi possível resolver');else qc.invalidateQueries({queryKey:['salon-reminders']});}}><Check/>Marcar atendida</Button>}</article>)}{!data?.handoffs.length&&<p className="py-5 text-muted-foreground">Nenhuma solicitação pendente.</p>}</section>
  </>;
}