import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Brand, inputCls } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { bookingCatalogOptions } from '@/lib/booking-data';
import { brl } from '@/lib/auth';

export const Route = createFileRoute('/reserva')({
  validateSearch: (s: Record<string, unknown>): { s?: string | undefined } => ({ s: typeof s['s'] === 'string' ? s['s'] : undefined }),
  head: () => ({ meta: [
    { title: 'Reserve seu horário — IAxis SalonPRO' },
    { name: 'description', content: 'Agende sem login: escolha serviço, profissional e horário no salão.' },
    { property: 'og:title', content: 'Reserve seu horário — IAxis SalonPRO' },
    { property: 'og:description', content: 'Agendamento online sem cadastro.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Reserva,
});

const today = () => new Date().toLocaleDateString('en-CA');

function Reserva() {
  const { s: slug } = Route.useSearch();
  const salons = useQuery({ queryKey: ['reserva-salons'], queryFn: async () => (await supabase.from('salons').select('id, name, slug, city').eq('status', 'ativo').order('name')).data ?? [] });
  const [salonId, setSalonId] = useState('');
  const chosen = salonId || salons.data?.find(x => x.slug === slug)?.id || (salons.data?.length === 1 ? salons.data[0]?.id : '') || '';
  const catalog = useQuery({ ...bookingCatalogOptions(chosen), enabled: !!chosen });
  const [service, setService] = useState('');
  const [pro, setPro] = useState('');
  const [day, setDay] = useState(today());
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ starts_at: string; deposit: number; pix_key: string } | null>(null);
  const slots = useQuery({
    queryKey: ['reserva-slots', chosen, service, pro, day], enabled: !!(chosen && service && pro && day),
    queryFn: async () => { const r = await supabase.rpc('salon_available_slots', { _salon: chosen, _service: service, _professional: pro, _day: day }); if (r.error) throw r.error; return r.data ?? []; },
  });

  async function reservar(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) { toast.error('Escolha um horário.'); return; }
    setBusy(true);
    const r = await supabase.rpc('public_book_appointment', { _salon: chosen, _service: service, _professional: pro, _starts: slot, _name: name, _whatsapp: phone });
    setBusy(false);
    if (r.error) { toast.error(r.error.message); slots.refetch(); return; }
    setDone(r.data as { starts_at: string; deposit: number; pix_key: string });
  }

  const sel = `${inputCls} mt-2`;
  return <div className="min-h-screen bg-gradient-navy p-6"><Brand /><main className="mx-auto max-w-xl py-10">
    <h1 className="text-4xl">Reserve seu horário</h1>
    {done ? <div className="mt-8 rounded-lg border border-gold/40 bg-card p-6">
      <h2 className="text-2xl text-gold">Reserva confirmada ✦</h2>
      <p className="mt-2">{new Date(done.starts_at).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
      {done.deposit > 0 && <p className="mt-3 text-sm">Sinal de {brl(done.deposit)} via PIX: <code className="text-gold">{done.pix_key}</code></p>}
      <Button className="mt-4" variant="outline" onClick={() => { setDone(null); setSlot(''); }}>Fazer outra reserva</Button>
    </div> : <form onSubmit={reservar} className="mt-8 space-y-4">
      {(salons.data?.length ?? 0) > 1 && <label className="block text-sm">Salão<select className={sel} value={chosen} onChange={e => { setSalonId(e.target.value); setService(''); setPro(''); setSlot(''); }}><option value="">Escolha</option>{salons.data?.map(x => <option key={x.id} value={x.id}>{x.name || 'Salão'}{x.city ? ` · ${x.city}` : ''}</option>)}</select></label>}
      {salons.data?.length === 0 && <p className="text-muted-foreground">Nenhum salão disponível no momento.</p>}
      {catalog.data && <>
        <p className="text-gold">{catalog.data.salon.name}</p>
        <label className="block text-sm">Serviço<select required className={sel} value={service} onChange={e => { setService(e.target.value); setSlot(''); }}><option value="">Escolha</option>{catalog.data.services.map(x => <option key={x.id} value={x.id}>{x.name} · {brl(x.price)} · {x.duration_min} min</option>)}</select></label>
        <label className="block text-sm">Profissional<select required className={sel} value={pro} onChange={e => { setPro(e.target.value); setSlot(''); }}><option value="">Escolha</option>{catalog.data.professionals.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="block text-sm">Dia<input type="date" required min={today()} className={sel} value={day} onChange={e => { setDay(e.target.value); setSlot(''); }} /></label>
        {service && pro && <div><p className="text-sm">Horários</p>{slots.isPending ? <p className="text-sm text-muted-foreground">Carregando…</p> : !slots.data?.length ? <p className="text-sm text-muted-foreground">Sem horários neste dia.</p> :
          <div className="mt-2 flex flex-wrap gap-2">{slots.data.map(h => <button type="button" key={h.starts_at} onClick={() => setSlot(h.starts_at)} className={`rounded-md border px-3 py-1 text-sm ${slot === h.starts_at ? 'border-primary text-gold' : ''}`}>{h.label}</button>)}</div>}</div>}
        <input required placeholder="Seu nome" maxLength={120} className={inputCls} value={name} onChange={e => setName(e.target.value)} />
        <input required placeholder="WhatsApp com DDD" maxLength={20} className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} />
        <Button type="submit" disabled={busy || !slot} className="w-full">Confirmar reserva</Button>
      </>}
    </form>}
  </main></div>;
}
