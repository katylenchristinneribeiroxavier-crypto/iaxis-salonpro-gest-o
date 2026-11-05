import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Save, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { saveSalonSettings } from '@/lib/salon-settings.functions';
import { maskSalonWhatsapp, whatsappDigits } from '@/lib/salon-whatsapp';
import { PageTitle, inputCls } from './Shell';
import { Button } from './ui/button';

export function SalonContactSettings() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const save = useServerFn(saveSalonSettings);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const own = ctx.salon?.owner_id === ctx.userId;
  const { data, error, isPending } = useQuery({
    queryKey: ['salon-contact-settings', ctx.userId], enabled: own,
    queryFn: async () => {
      const result = await supabase.from('configuracoes_salao').select('nome_salao, whatsapp_salao').eq('user_id', ctx.userId).maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    },
  });
  useEffect(() => { setName(data?.nome_salao || ctx.salon?.name || ''); setNumber(maskSalonWhatsapp(data?.whatsapp_salao || '')); }, [data, ctx.salon?.name]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await save({ data: { nome_salao: name, whatsapp_salao: whatsappDigits(number) } });
      await Promise.all([qc.invalidateQueries({ queryKey: ['salon-contact-settings'] }), qc.invalidateQueries({ queryKey: ['salon-context'] }), qc.invalidateQueries({ queryKey: ['salon-booking-contact'] }), qc.invalidateQueries({ queryKey: ['salons-public'] })]);
      toast.success('Nome e WhatsApp do seu salão salvos');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  };
  return <>
    <PageTitle title="Configurações" />
    {!own ? <p>Esta configuração é exclusiva da dona do salão.</p> : <div className="max-w-2xl">
      <MessageCircle className="mb-5 h-9 w-9 text-gold" />
      {error && <p role="alert" className="mb-4 text-destructive">Não foi possível carregar suas configurações.</p>}
      <form onSubmit={submit} className="space-y-6">
        <label className="block text-sm">Nome do meu Salão<input required maxLength={160} aria-label="Nome do meu Salão" className={`${inputCls} mt-2`} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block text-sm">Meu WhatsApp para receber agendamentos<input required type="tel" inputMode="tel" autoComplete="tel-national" aria-label="Meu WhatsApp para receber agendamentos" aria-describedby="whatsapp-explanation" placeholder="(11) 99999-9999" pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}" className={`${inputCls} mt-2`} value={number} onChange={e => setNumber(maskSalonWhatsapp(e.target.value))} /></label>
        <p id="whatsapp-explanation" className="text-sm text-muted-foreground">Este é o número que suas clientes vão falar para agendar automaticamente</p>
        <Button type="submit" disabled={busy || isPending || !!error}><Save className="h-4 w-4" />{busy ? 'Salvando…' : 'Salvar'}</Button>
      </form>
      <div className="mt-8 border-t pt-5"><Button variant="outline" asChild><Link to="/configuracoes/whatsapp">Conexão Evolution API</Link></Button></div>
    </div>}
  </>;
}