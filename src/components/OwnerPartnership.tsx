import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Copy, Link as LinkIcon, Ticket, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { brl } from '@/lib/auth';
import { salesSummary } from '@/lib/reseller-ai';
import { Button } from './ui/button';
import { PageTitle, Stat, inputCls } from './Shell';

export function OwnerPartnership() {
  const { data: salon } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [invite, setInvite] = useState('');
  const owner = salon.salon?.owner_id === salon.userId;
  const { data, error } = useQuery({ queryKey: ['owner-partnership', salon.userId], enabled: owner, queryFn: async () => {
    const [reseller, sales, logs] = await Promise.all([
      supabase.from('resellers').select('code,commission_pct').eq('user_id', salon.userId).maybeSingle(),
      supabase.from('referral_sales').select('*').eq('reseller_id', salon.userId).order('created_at', { ascending: false }),
      supabase.from('referral_payout_log').select('*').eq('reseller_id', salon.userId).order('created_at', { ascending: false }),
    ]);
    if (reseller.error || sales.error || logs.error) throw new Error('Não foi possível carregar suas indicações.');
    return { reseller: reseller.data, sales: sales.data ?? [], logs: logs.data ?? [] };
  }});
  if (!owner) return <h1 className="text-3xl">Disponível somente para a dona do salão</h1>;
  const totals = salesSummary(data?.sales ?? []);
  const generate = async (invitation: boolean) => {
    setBusy(true);
    try {
      const r = await supabase.rpc('become_reseller');
      if (r.error) throw new Error(r.error.message);
      if (invitation) {
        const c = await supabase.from('sale_codes').insert({ reseller_id: salon.userId }).select('code').single();
        if (c.error) throw new Error(c.error.message);
        setInvite(c.data.code);
      } else setLink(`${window.location.origin}/r/${r.data}`);
      await qc.invalidateQueries({ queryKey: ['owner-partnership'] });
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível gerar.'); }
    finally { setBusy(false); }
  };
  return <>
    <PageTitle title="Indique e Ganhe" />
    {error && <p role="alert" className="mb-4 text-destructive">{error.message}</p>}
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Saldo de comissões" value={brl(totals.pending)} /><Stat label="Comissões recebidas" value={brl(totals.paid)} /><Stat label="Compras indicadas" value={String(totals.count)} /></div>
    <section className="mt-6 border-y py-6">
      <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => generate(false)}><LinkIcon />Gerar meu Link de Indicação</Button><Button variant="outline" disabled={busy} onClick={() => generate(true)}><Ticket />Gerar Código de Convite</Button></div>
      {link && <div className="mt-4 flex flex-wrap items-center gap-3"><p className="break-all text-gold">{link}</p><Button variant="ghost" aria-label="Copiar link" title="Copiar link" onClick={() => { void navigator.clipboard.writeText(link); toast.success('Link copiado'); }}><Copy /></Button></div>}
      {invite && <div className="mt-4 flex items-center gap-3"><code className="text-xl text-gold">{invite}</code><Button variant="ghost" aria-label="Copiar código" title="Copiar código" onClick={() => { void navigator.clipboard.writeText(invite); toast.success('Código copiado'); }}><Copy /></Button></div>}
    </section>
    <form className="my-6 flex flex-wrap items-end gap-3" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      try { const r = await supabase.rpc('redeem_sale_code', { _code: code }); if (r.error) throw new Error(r.error.message); if (r.data !== 'OK') throw new Error(r.data); toast.success('Indicação vinculada à compra confirmada.'); setCode(''); await qc.invalidateQueries({ queryKey: ['owner-partnership'] }); }
      catch(e) { toast.error(e instanceof Error ? e.message : 'Não foi possível vincular.'); } finally { setBusy(false); }
    }}><label className="block w-full max-w-sm text-sm">Tem código de indicação?<input required maxLength={8} value={code} onChange={e => setCode(e.target.value.toUpperCase())} className={`${inputCls} mt-2`} /></label><Button disabled={busy} type="submit"><Check />Vincular indicação</Button></form>
    <h2 className="mt-8 text-2xl">Compras e comissões</h2>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{['Data','Cliente','Compra','Percentual','Comissão','Saldo'].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{data?.sales.map(s => <tr key={s.id} className="border-b"><td className="p-3">{new Date(s.created_at).toLocaleDateString('pt-BR')}</td><td className="p-3">{s.buyer_name}</td><td className="p-3">{brl(s.amount)}</td><td className="p-3">{s.applied_pct}%</td><td className="p-3">{brl(s.commission)}</td><td className="p-3">{brl(s.status === 'cancelado' ? 0 : s.commission - s.paid_amount)}</td></tr>)}</tbody></table></div>
    {!data?.sales.length && <p className="py-5 text-muted-foreground">Nenhuma compra indicada confirmada.</p>}
    <h2 className="mt-8 text-2xl">Histórico de repasses</h2>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Data</th><th className="p-3">Valor utilizado</th><th className="p-3">Saldo da comissão</th></tr></thead><tbody>{data?.logs.map(l => <tr key={l.id} className="border-b"><td className="p-3">{new Date(l.created_at).toLocaleString('pt-BR')}</td><td className="p-3">{brl(l.amount)}</td><td className="p-3">{brl(l.remaining)}</td></tr>)}</tbody></table></div>
    {!data?.logs.length && <p className="py-5 text-muted-foreground">Nenhum repasse registrado.</p>}
  </>;
}