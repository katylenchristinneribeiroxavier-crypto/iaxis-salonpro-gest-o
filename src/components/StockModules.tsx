import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AlertTriangle, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { estoqueBaixo, extrairQuantidade, numeroAproximado, pedidoWhatsApp, resumoEstoque, semaforo, usosRestantes } from '@/lib/estoque';
import { inputCls } from './Shell';
import { PhotoPicker } from './PhotoPicker';
import { Button } from './ui/button';

type Supplier = { id: string; nome: string; categoria: string; whatsapp: string; email: string; observacoes: string };
type Product = { id: string; supplier_id: string | null; nome: string; marca: string; unidade: string; quantidade_atual: number; quantidade_minima: number; custo_unitario: number; consumo_por_servico: number; servico_relacionado: string; qtd_usos_restantes: number | null; foto_path: string };

export function useStock() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const salonId = ctx.salon?.id;
  const q = useQuery({
    queryKey: ['stock', salonId], enabled: !!salonId,
    queryFn: async () => {
      const [s, p] = await Promise.all([
        supabase.from('suppliers').select('*').eq('salon_id', salonId!).order('categoria').order('nome'),
        supabase.from('products').select('*').eq('salon_id', salonId!).order('nome'),
      ]);
      if (s.error) throw s.error; if (p.error) throw p.error;
      return { suppliers: s.data as Supplier[], products: p.data as Product[] };
    },
  });
  return { ctx, salonId, suppliers: q.data?.suppliers ?? [], products: q.data?.products ?? [] };
}

function PedirButton({ product, suppliers, salon }: { product: Product; suppliers: Supplier[]; salon?: string | undefined }) {
  const s = suppliers.find((x) => x.id === product.supplier_id);
  if (!s?.whatsapp) return null;
  return <Button size="sm" className="bg-success text-background hover:bg-success/90" asChild>
    <a href={pedidoWhatsApp(s.whatsapp, s.nome, `${product.nome}${product.marca ? ` (${product.marca})` : ''}`, salon)} target="_blank" rel="noopener noreferrer"><MessageCircle />Pedir via WhatsApp</a>
  </Button>;
}

const emptySup = { nome: '', categoria: '', whatsapp: '', email: '', observacoes: '' };
export function SuppliersModule() {
  const { ctx, salonId, suppliers, products } = useStock();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptySup); const [editing, setEditing] = useState<string>();
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!salonId) return;
    const digits = form.whatsapp.replace(/\D/g, '');
    if (digits && (digits.length < 12 || digits.length > 13)) return void toast.error('WhatsApp com código do país e DDD, ex: +55 11 99999-0000');
    const row = { ...form, whatsapp: digits ? `+${digits}` : '' };
    const r = editing ? await supabase.from('suppliers').update(row).eq('id', editing) : await supabase.from('suppliers').insert({ ...row, salon_id: salonId });
    if (r.error) return void toast.error(r.error.message);
    setForm(emptySup); setEditing(undefined); toast.success('Fornecedor salvo'); qc.invalidateQueries({ queryKey: ['stock'] });
  };
  const del = async (id: string) => { const r = await supabase.from('suppliers').delete().eq('id', id); if (r.error) return void toast.error(r.error.message); qc.invalidateQueries({ queryKey: ['stock'] }); };
  const groups = [...new Set(suppliers.map((s) => s.categoria || 'Sem categoria'))];
  return <div className="space-y-8">
    <form onSubmit={save} className="grid gap-3 rounded-lg border bg-card p-5 sm:grid-cols-2">
      <h2 className="text-xl sm:col-span-2">{editing ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
      <input required aria-label="Nome" placeholder="Nome" className={inputCls} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
      <input aria-label="Categoria" placeholder="Categoria (ex: progressiva, tintura)" className={inputCls} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
      <input aria-label="WhatsApp" placeholder="WhatsApp com DDD (+55 11 99999-0000)" className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
      <input type="email" aria-label="E-mail" placeholder="E-mail" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <textarea aria-label="Observações" placeholder="Observações" className={`${inputCls} sm:col-span-2`} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
      <div className="flex gap-2 sm:col-span-2"><Button type="submit"><Plus />Salvar</Button>{editing && <Button type="button" variant="ghost" onClick={() => { setEditing(undefined); setForm(emptySup); }}>Cancelar</Button>}</div>
    </form>
    {groups.map((g) => <section key={g}><h3 className="mb-3 text-sm uppercase tracking-widest text-gold">{g}</h3><div className="space-y-3">
      {suppliers.filter((s) => (s.categoria || 'Sem categoria') === g).map((s) => {
        const low = products.filter((p) => p.supplier_id === s.id && estoqueBaixo(Number(p.quantidade_atual), Number(p.quantidade_minima)));
        const first = low[0] ?? products.find((p) => p.supplier_id === s.id);
        return <article key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
          <div className="min-w-48 flex-1"><p className="text-lg">{s.nome}</p><p className="text-sm text-muted-foreground">{[s.whatsapp, s.email].filter(Boolean).join(' · ')}</p>{s.observacoes && <p className="text-xs text-muted-foreground">{s.observacoes}</p>}</div>
          {s.whatsapp && <Button size="sm" className="bg-success text-background hover:bg-success/90" asChild><a target="_blank" rel="noopener noreferrer" href={pedidoWhatsApp(s.whatsapp, s.nome, low.length ? low.map((p) => p.nome).join(', ') : first?.nome ?? 'produtos', ctx.salon?.name)}><MessageCircle />Pedir via WhatsApp</a></Button>}
          <Button size="sm" variant="outline" onClick={() => { setEditing(s.id); setForm({ nome: s.nome, categoria: s.categoria, whatsapp: s.whatsapp, email: s.email, observacoes: s.observacoes }); }}><Pencil />Editar</Button>
          <Button size="sm" variant="ghost" aria-label="Excluir" onClick={() => del(s.id)}><Trash2 /></Button>
        </article>;
      })}</div></section>)}
    {suppliers.length === 0 && <p className="text-muted-foreground">Nenhum fornecedor cadastrado.</p>}
  </div>;
}

const dot = { verde: 'bg-success', amarelo: 'bg-gold', vermelho: 'bg-destructive' } as const;
const emptyProd = { nome: '', marca: '', unidade: 'ml', supplier_id: '', quantidade_atual: '', quantidade_minima: '', custo_unitario: '', consumo_por_servico: '', servico_relacionado: '', foto_path: '' };
export function ProductsModule() {
  const { ctx, salonId, suppliers, products } = useStock();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyProd); const [editing, setEditing] = useState<string>();
  const [mov, setMov] = useState<{ id: string; tipo: string; qtd: string; motivo: string }>();
  const [preview, setPreview] = useState(''); const [lendo, setLendo] = useState(false);
  const paths = products.map((p) => p.foto_path).filter(Boolean);
  const { data: fotos } = useQuery({ queryKey: ['product-photos', paths.join('|')], enabled: paths.length > 0, queryFn: async () => {
    const r = await supabase.storage.from('product_photos').createSignedUrls(paths, 3600);
    return Object.fromEntries((r.data ?? []).map((x) => [x.path, x.signedUrl]));
  } });
  const onFoto = async (file?: File) => {
    if (!file || !salonId) return;
    setPreview(URL.createObjectURL(file));
    const path = `${salonId}/${crypto.randomUUID()}.${file.type.split('/')[1] || 'jpg'}`;
    const up = await supabase.storage.from('product_photos').upload(path, file, { contentType: file.type });
    if (up.error) return void toast.error(up.error.message);
    setForm((f) => ({ ...f, foto_path: path }));
    setLendo(true);
    try {
      const { recognize } = await import('tesseract.js');
      const { data } = await recognize(file, 'por');
      const q = extrairQuantidade(data.text);
      if (q) { setForm((f) => ({ ...f, quantidade_atual: f.quantidade_atual || String(q.quantidade), unidade: q.unidade })); toast.success(`Encontrei ${q.quantidade}${q.unidade} na embalagem`); }
      else toast.info('Não achei a quantidade na foto. Digite abaixo.');
      const nome = data.text.split('\n').map((l) => l.trim()).find((l) => /[a-zA-Z]{4,}/.test(l));
      if (nome) setForm((f) => (f.nome ? f : { ...f, nome: nome.slice(0, 60) }));
    } catch { toast.info('Não consegui ler a foto. Digite os dados.'); } finally { setLendo(false); }
  };
  const previewUsos = usosRestantes(Number(form.quantidade_atual || 0), numeroAproximado(form.consumo_por_servico));
  const previewCor = semaforo(Number(form.quantidade_atual || 0), Number(form.quantidade_minima || 0));
  const set = (k: keyof typeof emptyProd) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!salonId) return;
    const row = { nome: form.nome, marca: form.marca, unidade: form.unidade, supplier_id: form.supplier_id || null, servico_relacionado: form.servico_relacionado,
      quantidade_atual: Number(form.quantidade_atual || 0), quantidade_minima: Number(form.quantidade_minima || 0), custo_unitario: Number(form.custo_unitario || 0), consumo_por_servico: numeroAproximado(form.consumo_por_servico), foto_path: form.foto_path };
    const r = editing ? await supabase.from('products').update(row).eq('id', editing) : await supabase.from('products').insert({ ...row, salon_id: salonId });
    if (r.error) return void toast.error(r.error.message);
    if (estoqueBaixo(row.quantidade_atual, row.quantidade_minima)) toast.warning(`Estoque baixo: ${row.nome}`); else toast.success('Produto salvo');
    setForm(emptyProd); setPreview(''); setEditing(undefined); qc.invalidateQueries({ queryKey: ['stock'] });
  };
  const move = async () => {
    if (!mov || !salonId) return; const p = products.find((x) => x.id === mov.id); if (!p) return;
    const q = Number(mov.qtd); if (!(q >= 0)) return;
    const atual = Number(p.quantidade_atual);
    const novo = mov.tipo === 'entrada' ? atual + q : mov.tipo === 'ajuste' ? q : Math.max(atual - q, 0);
    const u = await supabase.from('products').update({ quantidade_atual: novo }).eq('id', p.id); if (u.error) return void toast.error(u.error.message);
    await supabase.from('stock_movements').insert({ salon_id: salonId, product_id: p.id, tipo: mov.tipo, quantidade: q, motivo: mov.motivo });
    setMov(undefined); toast.success('Estoque atualizado'); qc.invalidateQueries({ queryKey: ['stock'] });
  };
  const del = async (id: string) => { const r = await supabase.from('products').delete().eq('id', id); if (r.error) return void toast.error(r.error.message); qc.invalidateQueries({ queryKey: ['stock'] }); };
  return <div className="space-y-8">
    <form onSubmit={save} className="grid gap-3 rounded-lg border bg-card p-5 sm:grid-cols-3">
      <h2 className="text-xl sm:col-span-3">{editing ? 'Editar produto' : 'Novo produto'}</h2>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gold/40 p-4 sm:col-span-3">
        <span className="text-sm text-gold">Passo 1</span>
        <PhotoPicker label="Tirar foto do produto" busy={lendo} onFile={onFoto} />
        {(preview || (form.foto_path && fotos?.[form.foto_path])) && <img src={preview || fotos?.[form.foto_path]} alt="Foto do produto" className="h-20 w-20 rounded-md object-cover" />}
        {lendo && <p className="text-sm text-muted-foreground">Lendo a embalagem…</p>}
      </div>
      <label className="text-sm">Nome<input required className={inputCls} value={form.nome} onChange={set('nome')} /></label>
      <label className="text-sm">Marca<input className={inputCls} value={form.marca} onChange={set('marca')} /></label>
      <label className="text-sm">Unidade<select className={inputCls} value={form.unidade} onChange={set('unidade')}>{['ml', 'g', 'unidade', 'litro'].map((u) => <option key={u}>{u}</option>)}</select></label>
      <label className="text-sm">Quantidade atual<input type="number" step="any" min="0" className={inputCls} value={form.quantidade_atual} onChange={set('quantidade_atual')} /></label>
      <label className="text-sm">Quantidade mínima<input type="number" step="any" min="0" className={inputCls} value={form.quantidade_minima} onChange={set('quantidade_minima')} /></label>
      <label className="text-sm">Custo unitário (R$)<input type="number" step="0.01" min="0" className={inputCls} value={form.custo_unitario} onChange={set('custo_unitario')} /></label>
      <label className="text-sm"><span className="text-gold">Passo 2 · </span>Quanto gasta por serviço<input placeholder="Ex: 200" className={inputCls} value={form.consumo_por_servico} onChange={set('consumo_por_servico')} /></label>
      <label className="text-sm">Serviço relacionado<input placeholder="ex: Progressiva" className={inputCls} value={form.servico_relacionado} onChange={set('servico_relacionado')} /></label>
      <label className="text-sm">Fornecedor<select className={inputCls} value={form.supplier_id} onChange={set('supplier_id')}><option value="">Nenhum</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></label>
      <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 sm:col-span-3"><span className="text-sm text-gold">Passo 3</span>
        <span className={`h-4 w-4 rounded-full ${dot[previewCor]}`} />
        <p>{previewUsos === null ? 'Informe quanto gasta por serviço para calcular' : `Restam ${previewUsos} ${previewUsos === 1 ? 'uso' : 'usos'}`}</p></div>
      <div className="flex gap-2 sm:col-span-3"><Button type="submit"><Plus />Salvar</Button>{editing && <Button type="button" variant="ghost" onClick={() => { setEditing(undefined); setForm(emptyProd); setPreview(''); }}>Cancelar</Button>}</div>
    </form>
    <p className="text-sm text-muted-foreground">Ao concluir um atendimento cujo serviço contém o “serviço relacionado”, o consumo é descontado automaticamente.</p>
    <div className="space-y-3">{products.map((p) => {
      const cor = semaforo(Number(p.quantidade_atual), Number(p.quantidade_minima));
      return <article key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
        {p.foto_path && fotos?.[p.foto_path] ? <img src={fotos[p.foto_path]} alt={p.nome} className="h-14 w-14 rounded-md object-cover" /> : <div className="h-14 w-14 rounded-md bg-muted/30" />}
        <span aria-label={`Semáforo ${cor}`} className={`h-4 w-4 shrink-0 rounded-full ${dot[cor]}`} />
        <div className="min-w-48 flex-1"><p className="text-lg">{p.nome} {p.marca && <span className="text-sm text-muted-foreground">· {p.marca}</span>}</p>
          <p className="text-sm text-gold">{resumoEstoque(p)}</p><p className="text-xs text-muted-foreground">Mínimo {Number(p.quantidade_minima)}{p.unidade} · {suppliers.find((s) => s.id === p.supplier_id)?.nome ?? 'sem fornecedor'}</p></div>
        {cor !== 'verde' && <PedirButton product={p} suppliers={suppliers} salon={ctx.salon?.name} />}
        <Button size="sm" variant="outline" onClick={() => setMov({ id: p.id, tipo: 'entrada', qtd: '', motivo: '' })}>Movimentar</Button>
        <Button size="sm" variant="outline" onClick={() => { setEditing(p.id); setForm({ nome: p.nome, marca: p.marca, unidade: p.unidade, supplier_id: p.supplier_id ?? '', quantidade_atual: String(p.quantidade_atual), quantidade_minima: String(p.quantidade_minima), custo_unitario: String(p.custo_unitario), consumo_por_servico: String(p.consumo_por_servico), servico_relacionado: p.servico_relacionado, foto_path: p.foto_path }); setPreview(''); }}><Pencil />Editar</Button>
        <Button size="sm" variant="ghost" aria-label="Excluir" onClick={() => del(p.id)}><Trash2 /></Button>
        {mov?.id === p.id && <div className="flex w-full flex-wrap gap-2">
          <select aria-label="Tipo" className={`${inputCls} max-w-40`} value={mov.tipo} onChange={(e) => setMov({ ...mov, tipo: e.target.value })}><option value="entrada">Entrada</option><option value="saida_uso">Saída (uso)</option><option value="perda">Perda</option><option value="ajuste">Ajuste (novo total)</option></select>
          <input aria-label="Quantidade" type="number" step="any" min="0" className={`${inputCls} max-w-32`} value={mov.qtd} onChange={(e) => setMov({ ...mov, qtd: e.target.value })} />
          <input aria-label="Motivo" placeholder="Motivo" className={`${inputCls} max-w-64`} value={mov.motivo} onChange={(e) => setMov({ ...mov, motivo: e.target.value })} />
          <Button size="sm" disabled={!mov.qtd} onClick={move}>Salvar</Button><Button size="sm" variant="ghost" onClick={() => setMov(undefined)}>Voltar</Button></div>}
      </article>;
    })}{products.length === 0 && <p className="text-muted-foreground">Nenhum produto cadastrado.</p>}</div>
  </div>;
}

export function LowStockCard() {
  const { ctx, suppliers, products } = useStock();
  const low = products.filter((p) => estoqueBaixo(Number(p.quantidade_atual), Number(p.quantidade_minima)));
  if (!ctx.salon || low.length === 0) return null;
  return <section className="mt-6 rounded-2xl border border-destructive/50 bg-card p-5">
    <h2 className="flex items-center gap-2 text-xl"><AlertTriangle className="text-destructive" />Estoque Baixo</h2>
    <div className="mt-3 space-y-2">{low.map((p) => <div key={p.id} className="flex flex-wrap items-center gap-3 border-b pb-2">
      <span className={`h-3 w-3 rounded-full ${dot[semaforo(Number(p.quantidade_atual), Number(p.quantidade_minima))]}`} />
      <p className="flex-1">{p.nome} <span className="text-sm text-muted-foreground">· {resumoEstoque(p)}</span></p>
      <PedirButton product={p} suppliers={suppliers} salon={ctx.salon?.name} />
    </div>)}</div>
  </section>;
}
