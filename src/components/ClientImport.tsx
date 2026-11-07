import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { brasiliaDate } from '@/lib/automatic-finance';
import { importAliases, normalizeHeader, importDate, normalizeImportPhone, type ClientImportRow } from '@/lib/service-return';
import { Button } from './ui/button';
import { inputCls } from './Shell';

export function ClientImport({ salonId }: { salonId: string }) {
  const input = useRef<HTMLInputElement>(null); const qc = useQueryClient();
  const [headers, setHeaders] = useState<string[]>([]); const [raw, setRaw] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({}); const [done,setDone]=useState(0); const [busy,setBusy]=useState(false);
  const [total,setTotal]=useState(0); const [late,setLate]=useState(0); const [result,setResult]=useState(''); const [issues,setIssues]=useState<string[]>([]);
  const load = async (file: File) => {
    if (!/\.(csv|xlsx)$/i.test(file.name)) return void toast.error('Escolha um arquivo CSV ou XLSX.');
    if (file.size>10*1024*1024) return void toast.error('O arquivo deve ter até 10 MB.');
    setBusy(true); setResult('');setDone(0);setIssues([]);
    try {
      const XLSX = await import('xlsx'); const book = XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
      const first=book.SheetNames[0]; const sheet=first ? book.Sheets[first] : undefined;
      if (!sheet) throw new Error('Planilha vazia.');
      const grid=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:'',raw:true});
      const h=grid.shift()?.map(String)??[]; if (!h.length) throw new Error('Cabeçalhos não encontrados.');
      setHeaders(h);setRaw(grid.filter(r=>r.some(v=>v!=='' && v!==null)));setMapping(Object.fromEntries(Object.entries(importAliases).map(([key,aliases])=>[key,String(h.findIndex(label=>aliases.includes(normalizeHeader(label))))])));
    } catch(e) { toast.error(e instanceof Error?e.message:'Não foi possível ler a planilha.'); } finally {setBusy(false);}
  };
  const start = async () => {
    const valid: ClientImportRow[]=[];const errors:string[]=[];
    raw.forEach((row,i)=>{const item={name:String(row[Number(mapping['name'])]??'').trim(),phone:normalizeImportPhone(row[Number(mapping['phone'])]),service:String(row[Number(mapping['service'])]??'').trim(),date:importDate(row[Number(mapping['date'])])};
      if(!item.name||!item.phone||!item.service||!item.date||item.date>brasiliaDate()) errors.push(`Linha ${i+2}: confira nome, telefone, serviço e data.`); else valid.push(item);
    });setIssues(errors);if(errors.length)return; if(!valid.length)return;
    setBusy(true);setTotal(valid.length);setDone(0);let added=0;let reused=0;
    try { for(let i=0;i<valid.length;i+=50){const r=await supabase.rpc('import_salon_clients',{_salon:salonId,_rows:valid.slice(i,i+50)});if(r.error)throw r.error;const counts=r.data as {added:number;reused:number};added+=counts.added;reused+=counts.reused;setDone(Math.min(i+50,valid.length));const insight=await supabase.rpc('salon_crm_insights',{_salon:salonId});if(insight.error)throw insight.error;setLate((insight.data as unknown as {needs_care:boolean}[]).filter(c=>c.needs_care).length); }
      setResult(`${added} clientes adicionadas · ${reused} cadastros existentes preservados.`);setRaw([]);setHeaders([]);await Promise.all([qc.invalidateQueries({queryKey:['records']}),qc.invalidateQueries({queryKey:['client-care']}),qc.invalidateQueries({queryKey:['agenda-day']})]);
    } catch(e){toast.error(e instanceof Error?e.message:'Importação interrompida. Os lotes concluídos foram preservados; você pode repetir o arquivo sem duplicar o histórico.');}finally{setBusy(false);}
  };
  return <section className="mb-6 space-y-4 border-b pb-6" aria-label="Importar clientes">
    <input ref={input} type="file" accept=".csv,.xlsx" className="hidden" aria-label="Arquivo de clientes" onChange={e=>{const f=e.target.files?.[0];if(f)void load(f);e.target.value='';}}/>
    <Button variant="outline" disabled={busy} onClick={()=>input.current?.click()}><Upload/>IMPORTAR CLIENTES</Button>
    {!!headers.length && <><div className="grid gap-3 sm:grid-cols-2">{Object.entries({name:'Nome',phone:'Telefone',service:'Último serviço',date:'Data do último atendimento'}).map(([key,label])=><label key={key} className="text-sm">{label}<select aria-label={`Coluna ${label}`} className={`${inputCls} mt-2`} disabled={busy} value={mapping[key]??'-1'} onChange={e=>setMapping({...mapping,[key]:e.target.value})}><option value="-1">Selecionar coluna</option>{headers.map((h,i)=><option value={i} key={i}>{h}</option>)}</select></label>)}</div><p className="text-sm">{raw.length} linhas · CSV / XLSX</p><p className="text-sm text-muted-foreground">Novos serviços ficam com preço e duração a revisar. A autorização para WhatsApp não é presumida.</p><div className="flex gap-2"><Button disabled={busy||Object.values(mapping).some(v=>v==='-1')} onClick={()=>void start()}><Check/>Confirmar importação</Button><Button variant="ghost" disabled={busy} onClick={()=>{setRaw([]);setHeaders([]);}}><X/>Cancelar</Button></div></>}
    {!!total&&<div aria-live="polite"><p className="text-sm">{busy?'Importando':'Importadas'} {total} clientes… {done} processadas · {late} clientes do salão com retorno atrasado.</p><progress aria-label="Progresso da importação" className="mt-2 h-3 w-full accent-gold" value={done} max={total}/></div>}
    {!!issues.length&&<div role="alert" className="text-sm text-destructive">{issues.slice(0,8).map(s=><p key={s}>{s}</p>)}<p>{issues.length} linhas precisam de correção; nada foi importado.</p></div>}
    {result&&<p role="status" className="text-sm text-gold">{result}</p>}
  </section>;
}