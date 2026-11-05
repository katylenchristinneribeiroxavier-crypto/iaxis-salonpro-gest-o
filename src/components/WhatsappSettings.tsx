import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MessageCircle, QrCode, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { getEvolutionSettings } from '@/lib/evolution.functions';
import { pairSalonEvolution, checkSalonEvolution } from '@/lib/platform-evolution.functions';
import { maskSalonWhatsapp, whatsappDigits } from '@/lib/salon-whatsapp';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle, inputCls } from './Shell';
import { Button } from './ui/button';

export function WhatsappSettings() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const [testing, setTesting] = useState(false);
  const [phone, setPhone] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const pair = useServerFn(pairSalonEvolution);
  const check = useServerFn(checkSalonEvolution);
  const getSettings = useServerFn(getEvolutionSettings);

  const { data } = useQuery({
    queryKey: ['whatsapp-config', ctx.salon?.id, ctx.userId],
    enabled: ctx.salon?.owner_id === ctx.userId,
    queryFn: () => getSettings(),
  });

  useEffect(() => {
    setPhone(maskSalonWhatsapp(data?.whatsapp_salao ?? ''));
  }, [data, ctx.salon?.id]);

  return <>
    <PageTitle title="Meu WhatsApp" />
    {ctx.salon?.owner_id !== ctx.userId ? <p>A conexão deve ser configurada pela dona do salão.</p> : <>
    <form className="max-w-xl space-y-5" onSubmit={async e => {
      e.preventDefault(); setTesting(true);
      try {
        const result = await pair({ data: { phone: whatsappDigits(phone) } });
        let image = result.qrImage;
        if (!image && result.qrText) { const QRCode = await import('qrcode'); image = await QRCode.toDataURL(result.qrText, { width: 280, margin: 2 }); }
        setQrImage(image); setPairingCode(result.pairingCode);
        toast.success(result.state === 'open' ? 'WhatsApp conectado' : image || result.pairingCode ? 'Conexão aguardando confirmação no WhatsApp' : 'QR ainda não disponível. Tente gerar novamente em instantes.');
        await qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
      } catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível conectar.'); }
      finally { setTesting(false); }
    }}>
      <label className="block text-sm">WhatsApp do meu salão<input className={`${inputCls} mt-2`} aria-label="WhatsApp do meu salão" type="tel" required value={phone} onChange={e => setPhone(maskSalonWhatsapp(e.target.value))} placeholder="(11) 99999-9999" /></label>
      <div className="flex flex-wrap gap-3"><Button disabled={testing} type="submit"><QrCode />{testing ? 'Preparando…' : qrImage ? 'Gerar novo QR Code' : 'Conectar meu WhatsApp'}</Button><Button type="button" variant="outline" disabled={testing || !data?.hasConnection} onClick={async () => {
        setTesting(true);
        try { const result = await check(); toast.success(result.state === 'open' ? 'WhatsApp conectado' : 'Aguardando confirmação no WhatsApp'); if (result.state === 'open') { setQrImage(''); setPairingCode(''); } await qc.invalidateQueries({ queryKey: ['whatsapp-config'] }); }
        catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível verificar.'); }
        finally { setTesting(false); }
      }}><RefreshCw />Verificar conexão</Button></div>
    </form>
    {(qrImage || pairingCode) && data?.evolution_connection_state !== 'open' && <section className="mt-6 max-w-xl border-t pt-5"><h2 className="mb-4 text-xl">Confirmação no WhatsApp</h2>{qrImage && <img src={qrImage} width={280} height={280} alt="QR Code para conectar o WhatsApp do salão" className="max-w-full rounded" />}{pairingCode && <p className="mt-4 font-mono text-2xl">{pairingCode}</p>}</section>}
    <dl className="mt-6 grid max-w-2xl gap-3 border-t pt-5 text-sm"><div><dt className="text-muted-foreground">Conexão</dt><dd>{data?.evolution_connection_state === 'open' ? 'Conectada' : data?.evolution_connection_state || 'Não testada'}</dd></div><div><dt className="text-muted-foreground">Última mensagem recebida</dt><dd>{data?.evolution_last_received_at ? new Date(data.evolution_last_received_at).toLocaleString('pt-BR') : 'Nenhuma mensagem recebida ainda'}</dd></div></dl>
    <Button asChild variant="outline" className="mt-6"><Link to="/mensagens"><MessageCircle />Abrir mensagens</Link></Button>
    </>}
  </>;
}
