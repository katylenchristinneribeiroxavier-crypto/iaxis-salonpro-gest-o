import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { FileUp, Square, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { brl } from '@/lib/auth';
import { intervaloMes } from '@/lib/salon-expenses';
import { PageTitle, inputCls } from './Shell';
import { Button } from './ui/button';
import { PhotoPicker } from './PhotoPicker';
import { SalonFinance } from './SalonFinance';

export function SalonExpenses() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions); const qc = useQueryClient();
  const [busy, setBusy] = useState(false); const [pending, setPending] = useState<{ path: string; mime: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  async function read(path: string, mime: string, resume = false) {
    if (!ctx.salon || busy) return;
    setBusy(true); abort.current = new AbortController();
    try {
      const session = await supabase.auth.getSession(); const token = session.data.session?.access_token;
      if (!token) throw new Error('Entre na sua conta.');
      const response = await fetch('/api/salon-receipt', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ salonId: ctx.salon.id, path, mime, resume }), signal: abort.current.signal });
      if (!response.ok) { const error = await response.json(); throw new Error(error.message ?? 'Não foi possível ler o comprovante.'); }
      const reader = response.body?.getReader(); if (!reader) throw new Error('Leitura indisponível.');
      const decoder = new TextDecoder(); let buffer = ''; let done = false;
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        buffer += decoder.decode(chunk.value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
        for (const line of lines) { if (!line.trim()) continue; const event = JSON.parse(line); if (event.type === 'error') throw new Error(event.message); if (event.type === 'done') { done = true; toast.success(`${event.count} despesas classificadas e registradas`); } }
      }
      if (!done) throw new Error('Leitura interrompida antes de salvar.');
      setPending(null); await qc.invalidateQueries({ queryKey: ['automatic-finance'] });
    } catch (e) { if (e instanceof Error && e.name === 'AbortError') toast.info('Leitura interrompida.'); else toast.error(e instanceof Error ? e.message : 'Erro na leitura.'); }
    finally { setBusy(false); abort.current = null; }
  }
  async function upload(file: File) {
    if (!ctx.salon || busy) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024) return void toast.error('Envie JPG, PNG, WEBP ou PDF de até 10 MB.');
    setBusy(true);
    const path = `${ctx.salon.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploaded = await supabase.storage.from('salon-receipts').upload(path, file, { contentType: file.type }); setBusy(false);
    if (uploaded.error) return void toast.error('Não foi possível enviar o comprovante.');
    setPending({ path, mime: file.type }); await read(path, file.type);
  }
  return <><PageTitle title="Notas e despesas automáticas" /><section className="mb-8 space-y-4 border-b pb-6"><PhotoPicker busy={busy} label="Fotografar nota ou despesa" onFile={file => { void upload(file); }} /><label className="inline-flex cursor-pointer items-center gap-2 text-gold"><FileUp />Enviar PDF<input type="file" accept="application/pdf" className="sr-only" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void upload(file); }} /></label>{busy && <div className="flex items-center gap-3"><p role="status">Lendo e separando despesas…</p><Button variant="outline" onClick={() => abort.current?.abort()}><Square />Parar</Button></div>}{pending && !busy && <Button variant="outline" onClick={() => read(pending.path, pending.mime, true)}><RotateCcw />Retomar leitura do comprovante</Button>}</section><SalonFinance /></>;
}

export function MasterSalonExpenses() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data } = useQuery({
    queryKey: ['master-despesas-salao', month],
    queryFn: async () => {
      const { inicio, fim } = intervaloMes(month);
      const [d, s] = await Promise.all([
        supabase.from('despesas_salao').select('salon_id, valor').gte('data_despesa', inicio).lt('data_despesa', fim),
        supabase.from('salons').select('id, name'),
      ]);
      if (d.error) throw d.error;
      return { rows: d.data ?? [], salons: s.data ?? [] };
    },
  });
  const rows = data?.rows ?? [];
  const total = rows.reduce((s, r) => s + Number(r.valor), 0);
  const porSalao = (data?.salons ?? []).map(s => ({ name: s.name || 'Salão sem nome', total: rows.filter(r => r.salon_id === s.id).reduce((a, r) => a + Number(r.valor), 0) })).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  return <section className="mt-10 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Despesas de todos os salões</h2><input aria-label="Mês das despesas" type="month" className={`${inputCls} max-w-48`} value={month} onChange={e => setMonth(e.target.value)} /></div>
    <p className="mt-3 text-lg">Total no mês: <b className="text-gold">{brl(total)}</b></p>
    {porSalao.map(s => <p key={s.name} className="mt-2 flex justify-between border-b pb-2"><span>{s.name}</span><span>{brl(s.total)}</span></p>)}
    {!porSalao.length && <p className="mt-2 text-muted-foreground">Nenhuma despesa cadastrada neste mês.</p>}
  </section>;
}
