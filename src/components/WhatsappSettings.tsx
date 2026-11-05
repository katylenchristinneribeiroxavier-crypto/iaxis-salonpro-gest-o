import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Save, PlugZap, MessageCircle, QrCode, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { getEvolutionSettings, saveEvolutionSettings, connectEvolution } from '@/lib/evolution.functions';
import { pairSalonEvolution, checkSalonEvolution } from '@/lib/platform-evolution.functions';
import { maskSalonWhatsapp, whatsappDigits } from '@/lib/salon-whatsapp';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle, inputCls } from './Shell';
import { Button } from './ui/button';

export function WhatsappSettings() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [instance, setInstance] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [phone, setPhone] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const pair = useServerFn(pairSalonEvolution);
  const check = useServerFn(checkSalonEvolution);
  const getSettings = useServerFn(getEvolutionSettings);
  const saveSettings = useServerFn(saveEvolutionSettings);
  const connect = useServerFn(connectEvolution);

  const { data } = useQuery({
    queryKey: ['whatsapp-config', ctx.salon?.id, ctx.userId],
    enabled: ctx.salon?.owner_id === ctx.userId,
    queryFn: () => getSettings(),
  });

  useEffect(() => {
    setUrl(data?.evolution_api_url ?? '');
    setInstance(data?.evolution_instance ?? ctx.salon?.id ?? '');
    setToken('');
    setPhone(maskSalonWhatsapp(data?.whatsapp_salao ?? ''));
  }, [data, ctx.salon?.id]);

  const salvar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!ctx.salon || ctx.salon.owner_id !== ctx.userId) return;
    setBusy(true);
    try {
      await saveSettings({ data: { url, instance, token } });
      setToken(''); toast.success('Configuração salva');
      await qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao salvar.'); }
    finally { setBusy(false); }
  };

  const testar = async (): Promise<void> => {
    setTesting(true);
    try {
      const result = await connect({ data: { callbackOrigin: window.location.hostname === 'localhost' ? 'https://id-preview--622f4b9e-289b-53b6-af7a-3ff5229c16ec.lovable.app' : window.location.origin } });
      toast.success(result.state === 'open' ? 'WhatsApp conectado e recebimento configurado' : `Recebimento configurado. Estado: ${result.state}. Conecte o número na Evolution.`);
      await qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível conectar.');
    } finally {
      setTesting(false);
    }
  };

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
      <div className="flex flex-wrap gap-3"><Button disabled={testing} type="submit"><QrCode />{testing ? 'Preparando…' : qrImage ? 'Gerar novo QR Code' : 'Conectar meu WhatsApp'}</Button><Button type="button" variant="outline" disabled={testing || !data?.evolution_instance} onClick={async () => {
        setTesting(true);
        try { const result = await check(); toast.success(result.state === 'open' ? 'WhatsApp conectado' : 'Aguardando confirmação no WhatsApp'); if (result.state === 'open') { setQrImage(''); setPairingCode(''); } await qc.invalidateQueries({ queryKey: ['whatsapp-config'] }); }
        catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível verificar.'); }
        finally { setTesting(false); }
      }}><RefreshCw />Verificar conexão</Button></div>
    </form>
    {(qrImage || pairingCode) && data?.evolution_connection_state !== 'open' && <section className="mt-6 max-w-xl border-t pt-5"><h2 className="mb-4 text-xl">Confirmação no WhatsApp</h2>{qrImage && <img src={qrImage} width={280} height={280} alt="QR Code para conectar o WhatsApp do salão" className="max-w-full rounded" />}{pairingCode && <p className="mt-4 font-mono text-2xl">{pairingCode}</p>}</section>}
    {!data?.evolution_managed && data?.evolution_api_url && <details className="mt-8 max-w-2xl border-t pt-5"><summary className="cursor-pointer text-sm text-muted-foreground">Conexão própria existente</summary>
    <form className="max-w-2xl space-y-5" onSubmit={salvar}>
      <label className="block text-sm">URL da API
        <input required type="url" aria-label="URL da API" placeholder="https://sua-api.exemplo.com" className={`${inputCls} mt-2`} value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="block text-sm">Instância
        <input required aria-label="Instância" placeholder="Nome da instância" className={`${inputCls} mt-2`} value={instance} onChange={(e) => setInstance(e.target.value)} />
      </label>
      <label className="block text-sm">API Key / Token
        <input type="password" autoComplete="new-password" placeholder={data ? 'Deixe em branco para manter a chave salva' : 'Chave da sua Evolution'} aria-label="API Key ou Token" className={`${inputCls} mt-2`} value={token} onChange={(e) => setToken(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}><Save />{busy ? 'Salvando…' : 'Salvar'}</Button>
        <Button type="button" variant="outline" disabled={testing || busy || !data} onClick={testar}><PlugZap />{testing ? 'Conectando…' : 'Testar conexão e ativar mensagens'}</Button>
      </div>
    </form>
    </details>}
    <dl className="mt-6 grid max-w-2xl gap-3 border-t pt-5 text-sm"><div><dt className="text-muted-foreground">Conexão</dt><dd>{data?.evolution_connection_state === 'open' ? 'Conectada' : data?.evolution_connection_state || 'Não testada'}</dd></div><div><dt className="text-muted-foreground">Última mensagem recebida</dt><dd>{data?.evolution_last_received_at ? new Date(data.evolution_last_received_at).toLocaleString('pt-BR') : 'Nenhuma mensagem recebida ainda'}</dd></div></dl>
    <Button asChild variant="outline" className="mt-6"><Link to="/mensagens"><MessageCircle />Abrir mensagens</Link></Button>
    </>}
  </>;
}
