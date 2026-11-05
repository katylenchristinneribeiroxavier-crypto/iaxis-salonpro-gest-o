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
  const [pixKey, setPixKey] = useState('');
  const [pixHolder, setPixHolder] = useState('');
  const [pixCity, setPixCity] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['deposit-config', salon?.id],
    enabled: !!salon,
    queryFn: async () => {
      if (!salon) return null;
      const r = await supabase.from('salons').select('cobrar_sinal, tipo_sinal, valor_sinal, pix_key, pix_holder, pix_city').eq('id', salon.id).single();
      if (r.error) throw r.error;
      return r.data;
    },
  });

  useEffect(() => {
    if (!config) return;
    setCobrar(config.cobrar_sinal);
    setTipo(config.tipo_sinal === 'fixo' ? 'fixo' : 'porcentagem');
    setValor(String(config.valor_sinal));
    setPixKey(config.pix_key); setPixHolder(config.pix_holder); setPixCity(config.pix_city);
  }, [config]);

  const valorNum = Number(valor) || 0;
  const exemplo = depositAmount(300, tipo, valorNum);

  const salvar = async (): Promise<void> => {
    if (!salon || !ctx.manager) return;
    if (cobrar && (valorNum <= 0 || (tipo === 'porcentagem' && valorNum > 100))) {
      toast.error(tipo === 'porcentagem' ? 'Informe uma porcentagem entre 1 e 100.' : 'Informe um valor maior que zero.');
      return;
    }
    if (cobrar && !pixKey.trim()) { toast.error('Informe a chave PIX que receberá o sinal.'); return; }
    setBusy(true);
    const r = await supabase.from('salons').update({ cobrar_sinal: cobrar, tipo_sinal: tipo, valor_sinal: valorNum, pix_key: pixKey.trim(), pix_holder: pixHolder.trim(), pix_city: pixCity.trim() }).eq('id', salon.id);
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
            <fieldset className="space-y-3 border-t pt-4">
              <legend className="text-sm font-medium">PIX que recebe o sinal</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1"><Label htmlFor="pix-key">Chave PIX</Label><Input id="pix-key" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, e-mail, telefone ou aleatória" /></div>
                <div className="space-y-1"><Label htmlFor="pix-holder">Nome do titular</Label><Input id="pix-holder" value={pixHolder} onChange={(e) => setPixHolder(e.target.value)} maxLength={25} /></div>
                <div className="space-y-1"><Label htmlFor="pix-city">Cidade</Label><Input id="pix-city" value={pixCity} onChange={(e) => setPixCity(e.target.value)} maxLength={15} /></div>
              </div>
              <p className="text-sm text-muted-foreground">O cliente paga o sinal direto nesta chave, por QR Code ou copia e cola. Você confirma o recebimento na tela Sinais.</p>
            </fieldset>
            <Button onClick={salvar} disabled={busy}><Save />{busy ? 'Salvando…' : 'Salvar configuração'}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
