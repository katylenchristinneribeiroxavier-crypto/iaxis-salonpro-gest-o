import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { brazilCalendar, MONTH_NAMES, occasionMessage } from '@/lib/brazil-calendar';
import { brasiliaDate } from '@/lib/automatic-finance';
import { Button } from './ui/button';
import { inputCls } from './Shell';
export function BrazilYearCalendar({ month, onMonth, salon }: { month: string; onMonth: (month: string) => void; salon: string }) {
  const [now, setNow] = useState<Date>();
  useEffect(() => { const update = () => setNow(new Date()); update(); const id = setInterval(update, 1000); return () => clearInterval(id); }, []);
  const year = Number(month.slice(0, 4));
  const events = brazilCalendar(year).filter(e => e.date.startsWith(month));
  return <section className="mb-8 border-b pb-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl"><CalendarDays />Calendário anual</h2><time className="text-sm text-gold">{now ? now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' · Brasília' : 'Brasília'}</time></div>
    <div className="my-4 flex items-center gap-3"><label className="text-sm">Ano<select aria-label="Ano do calendário" className={`${inputCls} ml-2 w-auto`} value={year} onChange={e => onMonth(`${e.target.value}-${month.slice(5)}`)}>{Array.from({ length: 12 }, (_, i) => (now ? Number(brasiliaDate(now).slice(0, 4)) : year) - 5 + i).map(y => <option key={y} value={y}>{y}</option>)}</select></label><Button variant="outline" onClick={() => onMonth(brasiliaDate().slice(0, 7))}>Hoje</Button></div>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{MONTH_NAMES.map((name, i) => { const m = `${year}-${String(i + 1).padStart(2, '0')}`; return <Button key={name} variant={month === m ? 'secondary' : 'outline'} aria-pressed={month === m} onClick={() => onMonth(m)}>{name}</Button>; })}</div>
    <h3 className="mt-6 text-lg">Datas de {MONTH_NAMES[Number(month.slice(5)) - 1]}</h3>
    <div className="mt-3 space-y-3">{events.map(e => <details key={e.key} className="border-b py-2"><summary className="cursor-pointer text-sm"><span className="text-gold">{e.date.slice(8)}/{e.date.slice(5, 7)}</span> · {e.name}<span className="block text-xs text-muted-foreground">{e.kind}</span></summary>{e.message && <p className="mt-3 text-sm">{occasionMessage(e.message, '', salon)}</p>}</details>)}{!events.length && <p className="text-sm text-muted-foreground">Sem datas nacionais destacadas neste mês.</p>}</div>
    <p className="mt-4 text-xs text-muted-foreground">Feriados nacionais previstos em lei; pontos facultativos federais de 2026. Feriados estaduais e municipais dependem da localidade.</p>
    <a className="mt-2 inline-block text-xs text-gold underline" href="https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026" target="_blank" rel="noopener noreferrer">Calendário federal · fonte oficial</a>
  </section>;
}