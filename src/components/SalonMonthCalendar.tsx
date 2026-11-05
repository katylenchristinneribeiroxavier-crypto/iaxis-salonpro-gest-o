import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle, inputCls } from './Shell';
import { Button } from './ui/button';

const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;
const SLOTS_PER_DAY = CLOSE_HOUR - OPEN_HOUR; // horários de 1h: 09h às 17h

type Appt = { id: string; starts_at: string; status: string; client_name: string };

function monthRange(month: string) {
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

export function SalonMonthCalendar() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const [month, setMonth] = useState(new Date().toLocaleDateString('en-CA').slice(0, 7));

  const { data } = useQuery({
    queryKey: ['agenda-month', ctx.salon?.id, month],
    enabled: !!ctx.salon,
    queryFn: async () => {
      if (!ctx.salon) return null;
      const { start, end } = monthRange(month);
      const r = await supabase
        .from('appointments')
        .select('id, starts_at, status, client_name')
        .eq('salon_id', ctx.salon.id)
        .gte('starts_at', start.toISOString())
        .lt('starts_at', end.toISOString())
        .order('starts_at');
      if (r.error) throw r.error;
      return (r.data ?? []) as Appt[];
    },
  });

  const days = useMemo(() => {
    const { start, end } = monthRange(month);
    const active = (data ?? []).filter((a) => a.status !== 'cancelado');
    const byDay = new Map<string, Appt[]>();
    for (const a of active) {
      const key = new Date(a.starts_at).toLocaleDateString('en-CA');
      byDay.set(key, [...(byDay.get(key) ?? []), a]);
    }
    const list: { date: Date; key: string; booked: number; free: string[]; occupancy: number }[] = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = d.toLocaleDateString('en-CA');
      const dayAppts = byDay.get(key) ?? [];
      const taken = new Set(dayAppts.map((a) => new Date(a.starts_at).getHours()));
      const free: string[] = [];
      for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
        if (!taken.has(h)) free.push(`${String(h).padStart(2, '0')}:00`);
      }
      list.push({
        date: new Date(d),
        key,
        booked: dayAppts.length,
        free,
        occupancy: Math.min(100, Math.round((dayAppts.length / SLOTS_PER_DAY) * 100)),
      });
    }
    return list;
  }, [data, month]);

  const totalBooked = days.reduce((s, d) => s + d.booked, 0);
  const avgOccupancy = days.length ? Math.round(days.reduce((s, d) => s + d.occupancy, 0) / days.length) : 0;
  const daysWithFree = days.filter((d) => d.free.length > 0);

  const shiftMonth = (delta: number) => {
    const d = new Date(`${month}-01T00:00:00`);
    d.setMonth(d.getMonth() + delta);
    setMonth(d.toLocaleDateString('en-CA').slice(0, 7));
  };

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <>
      <PageTitle title="Agendamentos por mês" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}>
          <ChevronLeft />
        </Button>
        <input
          aria-label="Mês"
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className={`${inputCls} max-w-48`}
        />
        <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => shiftMonth(1)}>
          <ChevronRight />
        </Button>
        <p className="font-display text-xl capitalize text-gold">{monthLabel}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Agendamentos no mês</p>
          <p className="font-display text-3xl text-gold">{totalBooked}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Ocupação média</p>
          <p className="font-display text-3xl text-gold">{avgOccupancy}%</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Dias com horários livres</p>
          <p className="font-display text-3xl text-gold">{daysWithFree.length}</p>
        </div>
      </div>

      <section className="mb-10 rounded-lg border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xl">
          <CalendarRange className="text-gold" /> Gráfico de ocupação por dia
        </h2>
        <div className="flex h-48 items-end gap-1 overflow-x-auto pb-2">
          {days.map((d) => (
            <div key={d.key} className="flex min-w-7 flex-1 flex-col items-center gap-1" title={`${d.date.toLocaleDateString('pt-BR')}: ${d.occupancy}% ocupado (${d.booked} agendamentos)`}>
              <span className="text-[10px] text-muted-foreground">{d.occupancy > 0 ? `${d.occupancy}%` : ''}</span>
              <div
                className="w-full rounded-t bg-gold/80"
                style={{ height: `${Math.max(d.occupancy, 2)}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{d.date.getDate()}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Ocupação calculada sobre {SLOTS_PER_DAY} horários por dia ({String(OPEN_HOUR).padStart(2, '0')}h às {CLOSE_HOUR}h). Agendamentos cancelados não contam.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl">Dias com horários livres</h2>
        <div className="space-y-3">
          {daysWithFree.map((d) => (
            <article key={d.key} className="rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg capitalize">
                  {d.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {d.booked} agendamento{d.booked === 1 ? '' : 's'} · {d.free.length} livre{d.free.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.free.map((h) => (
                  <span key={h} className="rounded-full border border-gold/40 px-3 py-1 text-sm text-gold">
                    {h}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {daysWithFree.length === 0 && (
            <p className="py-10 text-muted-foreground">Nenhum horário livre neste mês — agenda lotada!</p>
          )}
        </div>
      </section>
    </>
  );
}
