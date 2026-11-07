import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Trash2, Save, Pencil, Send } from 'lucide-react';
import { staffAccessMessage, staffAccessWhatsApp, staffPortalLink } from '@/lib/staff-portal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle, inputCls } from './Shell';
import { PhotoPicker } from './PhotoPicker';
import { uploadSalonPhoto } from '@/lib/salon-media';
import { splitCommission } from '@/lib/salon-rules';
import { Button } from './ui/button';
type Table = 'professions' | 'professionals' | 'services' | 'salon_clients' | 'supplier_brands' | 'supplier_products';
type Field = { key: string; label: string; type?: string; required?: boolean; min?: number; max?: number };
export const recordSpecs: Record<Table, { title: string; fields: Field[] }> = {
  professions: { title: 'Profissões', fields: [{ key: 'name', label: 'Nome da profissão', required: true }] },
  professionals: { title: 'Funcionários', fields: [{ key: 'name', label: 'Nome', required: true }, { key: 'whatsapp', label: 'WhatsApp (55 + DDD + número)' }, { key: 'commission_pct', label: 'Porcentagem do funcionário (%)', type: 'number', min: 0, max: 100, required: true }] },
  services: { title: 'Serviços e preços', fields: [{ key: 'name', label: 'Nome do serviço', required: true }, { key: 'price', label: 'Preço (R$)', type: 'number', min: 0, required: true }, { key: 'duration_min', label: 'Duração (minutos)', type: 'number', min: 1, required: true }] },
  salon_clients: { title: 'Clientes', fields: [{ key: 'name', label: 'Nome', required: true }, { key: 'whatsapp', label: 'WhatsApp (55 + DDD + número)', required: true }, { key: 'birthday', label: 'Aniversário', type: 'date' }] },
  supplier_brands: { title: 'Fornecedores parceiros', fields: [{ key: 'name', label: 'Nome da marca', required: true }, { key: 'contact_name', label: 'Responsável', required: true }, { key: 'whatsapp', label: 'WhatsApp (55 + DDD + número)', required: true }] },
  supplier_products: { title: 'Produtos da marca', fields: [{ key: 'name', label: 'Nome do produto', required: true }] },
};
export function SalonRecords({ table, brandId }: { table: Table; brandId?: string }) {
  const { data: ctx } = useSuspenseQuery(salonContextOptions); const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({}); const [editing, setEditing] = useState<string>(); const [busy, setBusy] = useState(false);
  const spec = recordSpecs[table];
  const { data: rows = [], error } = useQuery({ queryKey: ['records', table, ctx.salon?.id, brandId], enabled: !!ctx.salon, queryFn: async () => {
    if (!ctx.salon) return []; let query = supabase.from(table).select('*').eq('salon_id', ctx.salon.id).order('name');
    if (table === 'supplier_products' && brandId) { const r = await supabase.from('supplier_products').select('*').eq('salon_id', ctx.salon.id).eq('brand_id', brandId).order('name'); if (r.error) throw r.error; return r.data as unknown as Record<string, unknown>[]; }
    const r = await query; if (r.error) throw r.error; return r.data as unknown as Record<string, unknown>[];
  } });
  const { data: professions = [] } = useQuery({ queryKey: ['professions-select', ctx.salon?.id], enabled: table === 'professionals' && !!ctx.salon, queryFn: async () => { if (!ctx.salon) return []; const r = await supabase.from('professions').select('*').eq('salon_id',ctx.salon.id); return r.data ?? []; } });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!ctx.salon || !ctx.manager) return; setBusy(true);
    const patch: Record<string, unknown> = { salon_id: ctx.salon.id };
    for (const field of spec.fields) patch[field.key] = field.type === 'number' ? Number(form[field.key]) : field.type === 'date' ? form[field.key] || null : (form[field.key] || '').trim();
    if (table === 'professionals') { patch['profession_id'] = form['profession_id'] || null; patch['photo_url'] = form['photo_url'] || ''; }
    if (table === 'supplier_products') patch['brand_id'] = brandId;
    if (table === 'salon_clients') patch['consent'] = form['consent'] === 'true';
    const r = editing ? await supabase.from(table).update(patch as never).eq('id', editing).eq('salon_id',ctx.salon.id) : await supabase.from(table).insert(patch as never);
    setBusy(false); if (r.error) return void toast.error(r.error.message); setForm({}); setEditing(undefined); await qc.invalidateQueries({ queryKey: ['records'] }); toast.success('Cadastro salvo');
  };
  const remove = async (id: string) => { if (!ctx.salon || !confirm('Excluir este cadastro?')) return; const r = await supabase.from(table).delete().eq('id',id).eq('salon_id',ctx.salon.id); if (r.error) toast.error('Este cadastro tem vínculos e não pode ser excluído.'); else qc.invalidateQueries({ queryKey: ['records'] }); };
  return <><PageTitle title={spec.title} /><form onSubmit={submit} className="grid max-w-4xl gap-4 border-b pb-6 sm:grid-cols-2">
    {spec.fields.map(f => <label key={f.key} className="text-sm">{f.label}<input aria-label={f.label} required={f.required} type={f.type || 'text'} min={f.min} max={f.max} step={f.type==='number'?'0.01':undefined} className={`${inputCls} mt-2`} value={form[f.key] || ''} onChange={e => setForm({ ...form,[f.key]: e.target.value })} /></label>)}
    {table==='professionals' && form['commission_pct']?.trim() && Number.isFinite(Number(form['commission_pct'])) && Number(form['commission_pct']) >= 0 && Number(form['commission_pct']) <= 100 && <div className="flex flex-wrap gap-4 text-sm sm:col-span-2"><span className="text-gold">Funcionário: {Number(form['commission_pct'])}%</span><span>Parte da dona: {splitCommission(100, Number(form['commission_pct'])).salon}%</span></div>}
    {table==='professionals' && <label className="text-sm">Profissão<select required aria-label="Profissão" className={`${inputCls} mt-2`} value={form['profession_id'] || ''} onChange={e=>setForm({...form,profession_id:e.target.value})}><option value="">Selecionar profissão</option>{professions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
    {table==='professionals' && <div className="space-y-2 text-sm sm:col-span-2"><p>Foto</p>{form['photo_url'] && <img src={form['photo_url']} alt="Foto" className="h-20 w-20 rounded-full object-cover" />}<PhotoPicker label="Abrir Câmera" facing="user" onFile={async f=>{if(!ctx.salon)return;try{const url=await uploadSalonPhoto(ctx.salon.id,'equipe',f);setForm(v=>({...v,photo_url:url}));}catch(err){toast.error(err instanceof Error?err.message:'Falha no envio');}}} /></div>}
    {table==='salon_clients' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form['consent']==='true'} onChange={e=>setForm({...form,consent:String(e.target.checked)})} />Autorizou mensagens por WhatsApp</label>}
    <div className="flex items-end gap-2"><Button disabled={busy} type="submit">{editing ? <Save /> : <Plus />}{editing?'Salvar alterações':'Cadastrar'}</Button>{editing && <Button type="button" variant="ghost" onClick={()=>{setEditing(undefined);setForm({});}}>Cancelar</Button>}</div>
  </form>{error && <p role="alert" className="mt-4 text-destructive">Não foi possível carregar os cadastros.</p>}
  <div className="mt-6 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground">{table==='professionals'&&<th className="p-3">Foto</th>}{spec.fields.map(f=><th key={f.key} className="p-3">{f.label}</th>)}<th className="p-3">Ações</th></tr></thead><tbody>{rows.map(row=><tr key={String(row['id'])} className="border-b">{table==='professionals'&&<td className="p-3">{row['photo_url']?<img src={String(row['photo_url'])} alt="Foto" className="h-10 w-10 rounded-full object-cover"/>:'—'}</td>}{spec.fields.map(f=><td key={f.key} className="p-3">{f.key==='photo_url' ? (row[f.key] ? <img src={String(row[f.key])} alt="Foto do profissional" className="h-10 w-10 rounded-md object-cover"/> : '—') : String(row[f.key] ?? '—')}</td>)}<td className="p-3"><div className="flex gap-2">{table==='professionals' && ctx.salon && <Button title="Enviar Acesso WhatsApp" variant="outline" size="sm" onClick={()=>{const nome=String(row['name']??'');const wa=String(row['whatsapp']??'');if(wa.replace(/\D/g,'').length<10)return void toast.error('Cadastre o WhatsApp desta funcionária primeiro');const link=staffPortalLink(window.location.origin,String(row['portal_token']));window.open(staffAccessWhatsApp(wa,staffAccessMessage(nome,ctx.salon!.name,link,ctx.salon!.logo_url||undefined)),'_blank','noopener,noreferrer');}}><Send/>Enviar Acesso WhatsApp</Button>}<Button title="Editar" aria-label="Editar" variant="ghost" size="icon" onClick={()=>{setEditing(String(row['id']));setForm(Object.fromEntries(Object.entries(row).map(([k,v])=>[k,String(v??'')])));}}><Pencil /></Button><Button title="Excluir" aria-label="Excluir" variant="ghost" size="icon" onClick={()=>remove(String(row['id']))}><Trash2 /></Button></div></td></tr>)}</tbody></table>{rows.length===0 && <p className="py-8 text-muted-foreground">Nenhum cadastro.</p>}</div></>;
}