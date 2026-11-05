import { CalendarDays, CreditCard, Users, Wallet } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { salonContextOptions } from '@/lib/salon-data';
import { Button } from './ui/button';
import { SalonAgenda } from './SalonAgenda';
import { SalonDeposits } from './SalonDeposits';
import { SalonRecords } from './SalonRecords';
import { SalonSubscription } from './SalonSubscription';

const sections = [
  { id: 'agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { id: 'sinais', label: 'Sinais', icon: Wallet },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
];

export function SalonOverview() {
  const { data } = useSuspenseQuery(salonContextOptions);
  return <div className="mx-auto max-w-7xl">
    <header className="mb-6 flex flex-wrap items-center gap-4">
      {data.salon?.logo_url && <img src={data.salon.logo_url} alt={data.salon.name || 'Logo do salão'} className="h-16 w-16 rounded-md object-contain" />}
      <div><p className="mb-1 text-sm text-gold">Gestão do salão</p><h1 className="break-words text-3xl font-semibold">{data.salon?.name || 'Meu salão'}</h1></div>
    </header>
    <nav aria-label="Áreas da gestão integrada" className="mb-8 flex flex-wrap gap-2 border-b pb-5">
      {sections.map(({ id, label, icon: Icon }) => <Button key={id} asChild variant="outline"><a href={`#${id}`}><Icon className="h-4 w-4" />{label}</a></Button>)}
    </nav>
    <section id="agendamentos" aria-label="Agendamentos" className="scroll-mt-6"><SalonAgenda /></section>
    <section id="sinais" aria-label="Sinais" className="mt-10 scroll-mt-6 border-t pt-8"><SalonDeposits /></section>
    <section id="clientes" aria-label="Clientes" className="mt-10 scroll-mt-6 border-t pt-8"><SalonRecords table="salon_clients" /></section>
    <section id="assinatura" aria-label="Assinatura" className="mt-10 scroll-mt-6 border-t pt-8"><SalonSubscription /></section>
  </div>;
}