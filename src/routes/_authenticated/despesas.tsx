import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Download, FileUp, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { processarComprovante } from '@/lib/expenses.functions';
import { EXPENSE_CATEGORIES, despesasCsv } from '@/lib/expenses';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/_authenticated/despesas')({
  head: () => pageHead('Despesas e comprovantes', 'Envie notas fiscais e recibos, deixe a IA ler e categorizar e exporte suas despesas.'),
  component: Despesas,
});

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

function Despesas() {
  const qc = useQueryClient();
  const processar = useServerFn(processarComprovante);
  const [fila, setFila] = useState<string[]>([]);
  const [categoria, setCategoria] = useState('todas');
  const q = useQuery({ queryKey: ['despesas'], queryFn: async () => { const r = await supabase.from('despesas').select('*').order('created_at', { ascending: false }); if (r.error) throw r.error; return r.data; } });

  async function enviar(files: FileList | null) {
    if (!files?.length) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    for (const f of Array.from(files)) {
      const mime = TIPOS.find(t => t === f.type);
      if (!mime) { toast.error(`${f.name}: envie JPG, PNG, WEBP ou PDF.`); continue; }
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name}: limite de 10 MB.`); continue; }
      setFila(x => [...x, f.name]);
      try {
        const path = `${u.user.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, '_')}`;
        const up = await supabase.storage.from('comprovantes').upload(path, f, { contentType: mime });
        if (up.error) throw new Error('Falha no envio do arquivo.');
        const d = await processar({ data: { path, nome: f.name, mime } });
        toast.success(`${f.name}: ${d.categoria} · ${brl(Number(d.valor))}`);
        await qc.invalidateQueries({ queryKey: ['despesas'] });
      } catch (e) { toast.error(`${f.name}: ${e instanceof Error ? e.message : 'erro ao processar'}`); }
      finally { setFila(x => x.filter(n => n !== f.name)); }
    }
  }

  async function atualizar(id: string, campo: 'categoria', valor: string) {
    const r = await supabase.from('despesas').update({ [campo]: valor }).eq('id', id);
    if (r.error) toast.error('Não foi possível salvar.'); else qc.invalidateQueries({ queryKey: ['despesas'] });
  }
  async function remover(id: string, path: string) {
    if (!confirm('Excluir esta despesa e o comprovante?')) return;
    await supabase.storage.from('comprovantes').remove([path]);
    const r = await supabase.from('despesas').delete().eq('id', id);
    if (r.error) toast.error('Não foi possível excluir.'); else qc.invalidateQueries({ queryKey: ['despesas'] });
  }
  async function abrir(path: string) {
    const r = await supabase.storage.from('comprovantes').createSignedUrl(path, 300);
    if (r.data?.signedUrl) window.open(r.data.signedUrl, '_blank', 'noopener');
  }

  const rows = (q.data ?? []).filter(r => categoria === 'todas' || r.categoria === categoria);
  const total = rows.reduce((s, r) => s + Number(r.valor), 0);
  function exportar() {
    const blob = new Blob([despesasCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `despesas-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-h-screen bg-gradient-navy p-6">
      <Brand />
      <main className="mx-auto max-w-6xl py-10">
        <h1 className="flex items-center gap-3 text-4xl"><Receipt className="text-gold" />Despesas</h1>
        <p className="mt-2 text-muted-foreground">Envie notas fiscais e recibos (foto ou PDF). A IA lê o valor, a data e o fornecedor e escolhe a categoria — você pode corrigir depois.</p>
        <label className="mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gold/50 bg-card/60 p-8 text-center hover:border-gold">
          <FileUp className="h-8 w-8 text-gold" /><span>Clique para enviar comprovantes</span><span className="text-xs text-muted-foreground">JPG, PNG, WEBP ou PDF · até 10 MB cada</span>
          <input type="file" multiple accept={TIPOS.join(',')} className="sr-only" onChange={e => { enviar(e.target.files); e.target.value = ''; }} />
        </label>
        {fila.length > 0 && <p className="mt-3 text-sm text-gold">Lendo: {fila.join(', ')}…</p>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <select aria-label="Filtrar categoria" value={categoria} onChange={e => setCategoria(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="todas">Todas as categorias</option>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          <div className="flex items-center gap-4"><span className="text-lg">Total: <b className="text-gold">{brl(total)}</b></span><Button onClick={exportar} disabled={!rows.length}><Download />Exportar planilha</Button></div>
        </div>
        {q.isPending ? <p className="mt-6">Carregando…</p> : q.error ? <p role="alert" className="mt-6 text-destructive">Não foi possível carregar as despesas.</p> : !rows.length ? <p className="mt-6 text-muted-foreground">Nenhuma despesa ainda.</p> : (
          <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="p-3">Data</th><th className="p-3">Tipo</th><th className="p-3">Fornecedor</th><th className="p-3">Descrição</th><th className="p-3">Categoria</th><th className="p-3 text-right">Valor</th><th className="p-3" /></tr></thead>
              <tbody className="divide-y">{rows.map(r => (
                <tr key={r.id}>
                  <td className="p-3">{r.data_documento ? r.data_documento.split('-').reverse().join('/') : '—'}</td>
                  <td className="p-3">{r.tipo === 'nota_fiscal' ? 'Nota fiscal' : 'Recibo'}</td>
                  <td className="p-3">{r.fornecedor || '—'}{r.numero_documento && <span className="block text-xs text-muted-foreground">Nº {r.numero_documento}</span>}</td>
                  <td className="p-3">{r.descricao}</td>
                  <td className="p-3"><select aria-label="Categoria" value={r.categoria} onChange={e => atualizar(r.id, 'categoria', e.target.value)} className="rounded border bg-background px-2 py-1">{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></td>
                  <td className="p-3 text-right">{brl(Number(r.valor))}</td>
                  <td className="whitespace-nowrap p-3"><button className="mr-3 text-gold underline" onClick={() => abrir(r.arquivo_path)}>ver</button><button aria-label="Excluir" onClick={() => remover(r.id, r.arquivo_path)}><Trash2 className="inline h-4 w-4 text-destructive" /></button></td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
