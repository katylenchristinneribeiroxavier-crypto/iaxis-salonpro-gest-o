import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CalendarCheck, ArrowLeft, Headset, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { bookingCatalogOptions, bookingResultSchema } from '@/lib/booking-data';
import { introduction, buildPixPayload } from '@/lib/salon-rules';
import { brl } from '@/lib/auth';
import { Button } from './ui/button';
import { inputCls } from './Shell';

export function BookingAssistant({ salonId, manager = false }: { salonId: string; manager?: boolean }) {
  const qc = useQueryClient();
  const { data: catalog, isPending, isError } = useQuery(bookingCatalogOptions(salonId));
  const [serviceId, setService] = useState('');
  const [professionalId, setProfessional] = useState('');
  const [clientId, setClient] = useState('');
  const [day, setDay] = useState('');
  const [slot, setSlot] = useState('');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [question, setQuestion] = useState('');
  const [confirmed, setConfirmed] = useState<{ id: string; deposit: number; qr: string; payload: string } | null>(null);
  const service = catalog?.services.find(s => s.id === serviceId);
  const { data: clients = [] } = useQuery({ queryKey: ['assistant-clients', salonId], enabled: manager, queryFn: async () => {
    const result = await supabase.from('salon_clients').select('id,name').eq('salon_id', salonId).order('name');
    if (result.error) throw result.error;
    return result.data;
  } });
  const { data: slots = [], isFetching: fetchingSlots, isError: slotError } = useQuery({ queryKey: ['assistant-slots', salonId, serviceId, professionalId, day], enabled: !!serviceId && !!professionalId && !!day, queryFn: async () => {
    const result = await supabase.rpc('salon_available_slots', { _salon: salonId, _service: serviceId, _professional: professionalId, _day: day });
    if (result.error) throw result.error;
    return result.data;
  } });
  async function confirm() {
    if (busy || !slot || !service) return;
    setBusy(true);
    try {
      const result = await supabase.rpc('assistant_book_appointment', { _salon: salonId, _service: serviceId, _professional: professionalId, _starts: slot, ...(manager && clientId ? { _client: clientId } : {}) });
      if (result.error) throw result.error;
      const booking = bookingResultSchema.parse(result.data);
      let payload = '', qr = '';
      if (booking.deposit > 0) {
        payload = buildPixPayload(booking.pix_key, booking.pix_holder || catalog?.salon.name || '', booking.pix_city, booking.deposit, booking.id.replaceAll('-', '').slice(0, 20));
        qr = await QRCode.toDataURL(payload, { width: 240, margin: 1 });
      }
      setConfirmed({ id: booking.id, deposit: booking.deposit, payload, qr });
      await Promise.all([qc.invalidateQueries({ queryKey: ['assistant-slots'] }), qc.invalidateQueries({ queryKey: ['agenda-day'] }), qc.invalidateQueries({ queryKey: ['my-appts'] }), qc.invalidateQueries({ queryKey: ['salon-reminders'] })]);
      toast.success(booking.deposit > 0 ? 'Horário reservado; sinal pendente de pagamento' : 'Agendamento salvo');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível reservar. Atualize os horários.'); }
    finally { setBusy(false); }
  }
  async function requestHuman() {
    if (!question.trim() || busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Entre na sua conta para solicitar atendimento');
      const result = await supabase.from('booking_handoffs').insert({ salon_id: salonId, user_id: user.id, message: question.trim() });
      if (result.error) throw result.error;
      toast.success('Solicitação enviada à dona do salão'); setHandoff(false); setQuestion('');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível solicitar atendimento'); }
    finally { setBusy(false); }
  }
  if (isPending) return <p>Carregando assistente…</p>;
  if (isError || !catalog) return <p role="alert">Não foi possível carregar o assistente deste salão.</p>;
  return <section className="mx-auto max-w-3xl" aria-label="Assistente de agendamento">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-3xl"><CalendarCheck className="text-gold" />Assistente de agendamento</h2><Button variant="outline" onClick={() => setHandoff(!handoff)}><Headset />Falar com a dona</Button></div>
    <p className="mt-5 border-l-2 border-primary pl-4 text-lg">{introduction(catalog.salon.nome_agente, catalog.salon.name, catalog.salon.nome_agente ? catalog.salon.genero : undefined, catalog.salon.name_article)}</p>
    {handoff && <form className="mt-6 space-y-3 border-y py-5" onSubmit={e => { e.preventDefault(); requestHuman(); }}><label htmlFor="human-message">Mensagem para a dona</label><textarea id="human-message" required maxLength={2000} className={inputCls} rows={3} value={question} onChange={e => setQuestion(e.target.value)} /><Button disabled={busy} type="submit">Solicitar atendimento</Button></form>}
    {confirmed ? <div className="mt-8" aria-live="polite"><h3 className="flex items-center gap-2 text-2xl"><Check className="text-success" />{confirmed.deposit > 0 ? 'Horário reservado' : 'Agendamento confirmado'}</h3><p className="mt-3">{service?.name} · {new Date(slot).toLocaleString('pt-BR', { timeZone: catalog.salon.timezone })}</p><p className="mt-2 text-sm text-muted-foreground">Reserva #{confirmed.id.slice(0, 8)}</p>{confirmed.deposit > 0 && <><p className="mt-5">Sinal pendente: {brl(confirmed.deposit)}. A dona confirma o recebimento.</p><img src={confirmed.qr} alt="QR Code PIX do sinal" width={240} height={240} className="my-5 rounded-md" /><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(confirmed.payload); toast.success('PIX copiado'); }}><Copy />Copiar PIX</Button></>}<Button className="mt-5 block" onClick={() => { setConfirmed(null); setStep(0); setSlot(''); }}>Novo agendamento</Button></div> : <>
      <ol className="mt-8 grid grid-cols-4 border-y py-4 text-sm">{['Serviço','Profissional','Horário','Confirmar'].map((label, i) => <li key={label} className={i === step ? 'text-gold' : 'text-muted-foreground'}>{i + 1}. {label}</li>)}</ol>
      {step === 0 && <div className="mt-6"><h3 className="mb-4 text-2xl">Qual serviço você deseja?</h3><div className="grid gap-3 sm:grid-cols-2">{catalog.services.map(s => <Button key={s.id} variant="outline" className="h-auto min-h-20 justify-between gap-3 whitespace-normal text-left" onClick={() => { setService(s.id); setSlot(''); setStep(1); }}><span>{s.name}<span className="mt-1 block text-xs text-muted-foreground">{s.duration_min} minutos</span></span><span className="shrink-0 text-gold">{brl(s.price)}</span></Button>)}</div>{!catalog.services.length && <p className="text-muted-foreground">O salão ainda não cadastrou serviços.</p>}</div>}
      {step === 1 && <div className="mt-6"><h3 className="mb-4 text-2xl">Com qual profissional?</h3><div className="grid gap-3 sm:grid-cols-2">{catalog.professionals.map(p => <Button key={p.id} variant="outline" onClick={() => { setProfessional(p.id); setSlot(''); setStep(2); }}>{p.name}</Button>)}</div>{!catalog.professionals.length && <p>Nenhum profissional cadastrado.</p>}</div>}
      {step === 2 && <div className="mt-6"><h3 className="mb-4 text-2xl">Escolha um horário livre</h3><label className="block text-sm">Data<input aria-label="Data do agendamento" type="date" value={day} min={new Date().toLocaleDateString('en-CA', { timeZone: catalog.salon.timezone })} onChange={e => { setDay(e.target.value); setSlot(''); }} className={`${inputCls} mt-2 max-w-56`} /></label><p className="my-4 text-sm text-muted-foreground">{catalog.salon.opening_time}–{catalog.salon.closing_time === '00:00' ? 'meia-noite' : catalog.salon.closing_time} · {catalog.salon.timezone}</p>{fetchingSlots ? <p>Consultando horários…</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{slots.map(s => <Button key={s.starts_at} variant="outline" onClick={() => { setSlot(s.starts_at); setStep(3); }}>{s.label}</Button>)}</div>}{day && !fetchingSlots && !slots.length && <p className="mt-4">{slotError ? 'Não foi possível consultar os horários.' : 'Nenhum horário disponível nesta data.'}</p>}</div>}
      {step === 3 && <div className="mt-6 space-y-4"><h3 className="text-2xl">Confirme sua reserva</h3><dl className="space-y-3"><div><dt className="text-sm text-muted-foreground">Serviço</dt><dd>{service?.name} · {brl(service?.price ?? 0)}</dd></div><div><dt className="text-sm text-muted-foreground">Profissional</dt><dd>{catalog.professionals.find(p => p.id === professionalId)?.name}</dd></div><div><dt className="text-sm text-muted-foreground">Data e horário</dt><dd>{new Date(slot).toLocaleString('pt-BR', { timeZone: catalog.salon.timezone })}</dd></div></dl>{manager && <label className="block text-sm">Cliente<select aria-label="Cliente do agendamento" className={`${inputCls} mt-2`} value={clientId} onChange={e => setClient(e.target.value)} required><option value="">Selecione a cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}<Button disabled={busy || (manager && !clientId)} onClick={confirm}><CalendarCheck />{busy ? 'Reservando…' : 'Confirmar reserva'}</Button></div>}
      {step > 0 && <Button variant="ghost" className="mt-6" disabled={busy} onClick={() => setStep(step - 1)}><ArrowLeft />Voltar</Button>}
    </>}
  </section>;
}