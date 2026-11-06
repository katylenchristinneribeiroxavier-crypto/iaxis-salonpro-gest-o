import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MessageCircle, QrCode, RefreshCw, Send, Unplug, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { getEvolutionSettings } from '@/lib/evolution.functions';
import { pairSalonEvolution, checkSalonEvolution, testSalonEvolution, disconnectSalonEvolution } from '@/lib/platform-evolution.functions';
import { maskSalonWhatsapp, whatsappDigits } from '@/lib/salon-whatsapp';
import { salonContextOptions } from '@/lib/salon-data';
import { inputCls } from './Shell';
import { Button } from './ui/button';

const STEPS = [
  { n: 1, t: 'Digite o número', d: 'O WhatsApp do salão, com DDD.' },
  { n: 2, t: 'Gere o QR Code', d: 'Clique em GERAR QR CODE.' },
  { n: 3, t: 'Escaneie no celular', d: 'WhatsApp › Aparelhos conectados › Conectar aparelho.' },
];

export function WhatsappSettings() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const pair = useServerFn(pairSalonEvolution);
  const check = useServerFn(checkSalonEvolution);
  const test = useServerFn(testSalonEvolution);
  const disconnect = useServerFn(disconnectSalonEvolution);
  const getSettings = useServerFn(getEvolutionSettings);
  const owner = ctx.salon?.owner_id === ctx.userId;

  const { data } = useQuery({ queryKey: ['whatsapp-config', ctx.salon?.id, ctx.userId], enabled: owner, queryFn: () => getSettings() });
  useEffect(() => { setPhone(maskSalonWhatsapp(data?.whatsapp_salao ?? '')); }, [data]);

  const state = data?.evolution_connection_state;
  const connected = state === 'open';
  const connecting = !connected && (Boolean(qrImage || pairingCode) || state === 'connecting');
  const refresh = () => qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Algo deu errado.'); } finally { setBusy(false); } };

  // While the QR is on screen, poll the connection so the status turns green after scanning.
  useEffect(() => {
    if (!connecting) return;
    const id = setInterval(async () => { try { const r = await check(); if (r.state === 'open') { setQrImage(''); setPairingCode(''); toast.success('WhatsApp conectado!'); } await refresh(); } catch { /* keep polling */ } }, 5000);
    return () => clearInterval(id);
  }, [connecting]);

  if (!owner) return <p className="mt-8">A conexão do WhatsApp é feita pela dona do salão.</p>;

  return <section className="mt-8 rounded-xl border border-gold/30 bg-card p-6">
    <div className="flex items-start gap-4">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><MessageCircle className="size-7" /></span>
      <div><h2 className="text-2xl">Conecte seu WhatsApp para automatizar</h2><p className="text-muted-foreground">Suas clientes receberão confirmação automática</p></div>
      <span className={`ml-auto rounded-full px-3 py-1 text-sm font-medium ${connected ? 'bg-success text-success-foreground' : connecting ? 'bg-gold text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{connected ? 'Conectado' : connecting ? 'Conectando' : 'Desconectado'}</span>
    </div>

    <ol className="mt-6 grid gap-3 sm:grid-cols-3">{STEPS.map(s => <li key={s.n} className="rounded-lg border p-4"><span className="grid size-8 place-items-center rounded-full bg-gold font-bold text-primary-foreground">{s.n}</span><p className="mt-2 font-medium">{s.t}</p><p className="text-sm text-muted-foreground">{s.d}</p></li>)}</ol>

    <form className="mt-6 max-w-xl space-y-4" onSubmit={e => { e.preventDefault(); run(async () => {
      const result = await pair({ data: { phone: whatsappDigits(phone) } });
      let image = result.qrImage;
      if (!image && result.qrText) { const QRCode = await import('qrcode'); image = await QRCode.toDataURL(result.qrText, { width: 280, margin: 2 }); }
      setQrImage(image); setPairingCode(result.pairingCode);
      toast.success(result.state === 'open' ? 'WhatsApp conectado' : image || result.pairingCode ? 'Escaneie o QR Code com seu celular' : 'QR ainda não disponível. Tente de novo em instantes.');
      await refresh();
    }); }}>
      <label className="block text-sm">Número do WhatsApp do salão (com DDD)<input className={`${inputCls} mt-2`} type="tel" required value={phone} onChange={e => setPhone(maskSalonWhatsapp(e.target.value))} placeholder="(11) 99999-9999" /></label>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} type="submit"><QrCode />{busy ? 'Aguarde…' : 'GERAR QR CODE'}</Button>
        <Button type="button" variant="outline" disabled={busy || !data?.hasConnection} onClick={() => run(async () => { const r = await check(); toast.success(r.state === 'open' ? 'WhatsApp conectado' : 'Ainda aguardando o celular'); await refresh(); })}><RefreshCw />Atualizar status</Button>
        <Button type="button" variant="outline" disabled={busy || !connected} onClick={() => run(async () => { await test(); toast.success('Mensagem de teste enviada para o seu número'); })}><Send />Testar conexão</Button>
        <Button type="button" variant="destructive" disabled={busy || !data?.hasConnection} onClick={() => run(async () => { await disconnect(); setQrImage(''); setPairingCode(''); toast.success('WhatsApp desconectado'); await refresh(); })}><Unplug />Desconectar</Button>
      </div>
    </form>

    {(qrImage || pairingCode) && !connected && <div className="mt-6 max-w-xl border-t pt-5"><h3 className="mb-3 text-lg">Escaneie com o WhatsApp do salão</h3>{qrImage && <img src={qrImage} width={280} height={280} alt="QR Code para conectar o WhatsApp do salão" className="rounded bg-background p-2" />}{pairingCode && <p className="mt-4">Ou digite o código: <span className="font-mono text-2xl">{pairingCode}</span></p>}</div>}

    <div className="mt-6 border-t pt-5">
      <h3 className="mb-3 text-lg">Automações {connected ? 'ligadas' : '(ligam quando conectar)'}</h3>
      <ul className="grid gap-2 text-sm">{['Mensagem quando um agendamento é criado', 'Confirmação quando o horário é confirmado', 'Lembrete 1 dia antes do horário'].map(a => <li key={a} className="flex items-center gap-2"><CheckCircle2 className={`size-4 ${connected ? 'text-success' : 'text-muted-foreground'}`} />{a}</li>)}</ul>
      <Button asChild variant="link" className="mt-2 px-0"><Link to="/mensagens">Abrir mensagens</Link></Button>
    </div>
  </section>;
}
