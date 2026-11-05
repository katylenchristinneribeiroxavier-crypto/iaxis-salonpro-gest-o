import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { depositAmount } from '@/lib/salon-rules';
import { brl } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

export function ConfigSinalAgendamento() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const salon = ctx.salon;
  const qc = useQueryClient();
  const [cobrar, setCobrar] = useState(false);
  const [tipo, setTipo] = useState<'porcentagem' | 'fixo'>('porcentagem');
  const [valor, setValor] = useState('0');
  const [busy, setBusy] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['deposit-config', salon?.id],
    enabled: !!salon,
    queryFn: async () => {
      if (!salon) return null;
      const r = await supabase.from('salons').select('cobrar_sinal, tipo_sinal, valor_sinal').eq('id', salon.id).single();
      if (r.error) throw r.error;
      return r.data;
    },
  });

  useEffect(() => {
    if (!config) return;
    setCobrar(config.cobrar_sinal);
    setTipo(config.tipo_sinal === 'fixo' ? 'fixo' : 'porcentagem');
    setValor(String(config.valor_sinal));
  }, [config]);

  const valorNum = Number(valor) || 0;
  const exemplo = depositAmount(300, tipo, valorNum);

  const salvar = async (): Promise<void> => {
    if (!salon || !ctx.manager) return;
    if (cobrar && (valorNum <= 0 || (tipo === 'porcentagem' && valorNum > 100))) {
      toast.error(tipo === 'porcentagem' ? 'Informe uma porcentagem entre 1 e 100.' : 'Informe um valor maior que zero.');
      return;
    }
    setBusy(true);
    const r = await supabase.from('salons').update({ cobrar_sinal: cobrar, tipo_sinal: tipo, valor_sinal: valorNum }).eq('id', salon.id);
    setBusy(false);
    if (r.error) { toast.error(r.error.message); return; }
    await qc.invalidateQueries({ queryKey: ['deposit-config'] });
    toast.success('Configuração de sinal salva');
  };

  return (
    <Card className="mt-8 max-w-3xl">
      <CardHeader>
        <CardTitle>Cobrar sinal para agendar?</CardTitle>
        <CardDescription>Evite faltas. O horário só confirma após o pagamento do sinal. (Opcional)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Switch checked={cobrar} onCheckedChange={setCobrar} aria-label="Cobrar sinal" />
          <Label>{cobrar ? 'Ativado' : 'Desativado'}</Label>
        </div>
        {cobrar && (
          <div className="mt-4 space-y-4">
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as 'porcentagem' | 'fixo')} className="flex gap-4">
              <div className="flex items-center gap-2"><RadioGroupItem value="porcentagem" id="pct" /><Label htmlFor="pct">Porcentagem (%)</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="fixo" id="fixo" /><Label htmlFor="fixo">Valor fixo (R$)</Label></div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <Label htmlFor="valor-sinal">{tipo === 'porcentagem' ? 'Qual %?' : 'Qual valor?'}</Label>
              <Input id="valor-sinal" type="number" min={0} max={tipo === 'porcentagem' ? 100 : undefined} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={tipo === 'porcentagem' ? '30' : '30.00'} className="w-32" />
              <span>{tipo === 'porcentagem' ? '%' : 'R$'}</span>
            </div>
            <p className="rounded bg-muted p-2 text-sm text-muted-foreground">
              Ex.: serviço de {brl(300)} com {valorNum}{tipo === 'porcentagem' ? '%' : ' reais'} = sinal de {brl(exemplo)}
            </p>
            <Button onClick={salvar} disabled={busy}><Save />{busy ? 'Salvando…' : 'Salvar configuração'}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
