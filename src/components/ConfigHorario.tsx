import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

export function ConfigHorario() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const salon = ctx.salon;
  const qc = useQueryClient();
  const [abertura, setAbertura] = useState('09:00');
  const [fechamento, setFechamento] = useState('18:00');
  const [busy, setBusy] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['opening-hours', salon?.id],
    enabled: !!salon,
    queryFn: async () => {
      if (!salon) return null;
      const r = await supabase.from('salons').select('opening_time, closing_time').eq('id', salon.id).single();
      if (r.error) throw r.error;
      return r.data;
    },
  });

  useEffect(() => {
    if (!config) return;
    setAbertura(config.opening_time.slice(0, 5));
    setFechamento(config.closing_time.slice(0, 5));
  }, [config]);

  const salvar = async (): Promise<void> => {
    if (!salon || !ctx.manager) return;
    if (abertura >= fechamento) {
      toast.error('A abertura precisa ser antes do fechamento.');
      return;
    }
    setBusy(true);
    const r = await supabase.from('salons').update({ opening_time: abertura, closing_time: fechamento }).eq('id', salon.id);
    setBusy(false);
    if (r.error) { toast.error(r.error.message); return; }
    await qc.invalidateQueries({ queryKey: ['opening-hours'] });
    await qc.invalidateQueries({ queryKey: ['agenda-month'] });
    toast.success('Horário de funcionamento salvo');
  };

  return (
    <Card className="mt-8 max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="text-gold" /> Horário de funcionamento</CardTitle>
        <CardDescription>Define os horários livres mostrados na agenda do mês e no agendamento online.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="hora-abertura">Abertura</Label>
            <Input id="hora-abertura" type="time" value={abertura} onChange={(e) => setAbertura(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hora-fechamento">Fechamento</Label>
            <Input id="hora-fechamento" type="time" value={fechamento} onChange={(e) => setFechamento(e.target.value)} className="w-36" />
          </div>
          <Button onClick={salvar} disabled={busy}><Save />{busy ? 'Salvando…' : 'Salvar horário'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
