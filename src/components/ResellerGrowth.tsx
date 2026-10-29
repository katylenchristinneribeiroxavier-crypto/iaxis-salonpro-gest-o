import { useState,useRef,useEffect } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { Sparkles,Target,Phone,Square,Copy,Download,Plus,Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { MessageResponse } from './ai-elements/message';
import { inputCls } from './Shell';

export function ResellerGrowth(){
 const qc=useQueryClient();
 const [tab,setTab]=useState<'plan'|'leads'>('plan');
 const [ideal,setIdeal]=useState('');const [goal,setGoal]=useState('5');const [days,setDays]=useState('30');const [hours,setHours]=useState('10');const [region,setRegion]=useState('');const [context,setContext]=useState('');
 const [lead,setLead]=useState({salonName:'',contactName:'',phone:'',city:'',context:''});
 const [busy,setBusy]=useState(false);const [plan,setPlan]=useState('');const [reasoning,setReasoning]=useState('');const [error,setError]=useState('');const abort=useRef<AbortController|null>(null);
 const {data}=useQuery({queryKey:['reseller-growth'],queryFn:async()=>{
   const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Entre na sua conta');
   const [settings,leads]=await Promise.all([supabase.from('reseller_ai_settings').select('*').eq('user_id',user.id).maybeSingle(),supabase.from('reseller_leads').select('*').eq('reseller_id',user.id).order('created_at',{ascending:false})]);
   if(settings.error)throw settings.error;if(leads.error)throw leads.error;return {settings:settings.data,leads:leads.data};
 }});
 useEffect(()=>{if(data?.settings?.ideal_customer)setIdeal(data.settings.ideal_customer);},[data?.settings?.ideal_customer]);
 useEffect(()=>()=>abort.current?.abort(),[]);
 async function generate(e:React.FormEvent){
  e.preventDefault();setError('');setBusy(true);setReasoning('');if(tab==='plan')setPlan('');
  const controller=new AbortController();abort.current=controller;
  try{
   const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('Entre na sua conta');
   const response=await fetch(tab==='plan'?'/api/reseller-ai-plan':'/api/reseller-ai-lead',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(tab==='plan'?{goal:Number(goal),days:Number(days),hours:Number(hours),region,idealCustomer:ideal,context}:{...lead,idealCustomer:ideal}),signal:controller.signal});
   if(!response.ok){const body=await response.json();throw new Error(body.message??`Não foi possível gerar (${response.status}).`);}
   if(!response.body)throw new Error('Resposta vazia');
   const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';let done=false;
   const consume=(line:string)=>{if(!line.trim())return;const event=JSON.parse(line);if(event.type==='error')throw new Error(event.message);if(event.type==='text')setPlan(p=>p+event.text);if(event.type==='reasoning')setReasoning(p=>p+event.text);if(event.type==='done')done=true;};
   while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});let newline;while((newline=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,newline));buffer=buffer.slice(newline+1);}}
   buffer+=decoder.decode();if(buffer.trim())consume(buffer);if(!done)throw new Error('A geração foi interrompida antes de concluir.');
   if(tab==='leads'){setLead({salonName:'',contactName:'',phone:'',city:'',context:''});toast.success('Lead salvo e qualificado');}
  }catch(err){if(controller.signal.aborted)setError('Geração interrompida.');else setError(err instanceof Error?err.message:'Não foi possível gerar');}
  finally{setBusy(false);abort.current=null;await qc.invalidateQueries({queryKey:['reseller-growth']});}
 }
 return <section className="mt-10 border-t pt-8">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-gold">Lovable AI</p><h2 className="mt-1 text-3xl">Conquiste novos salões</h2></div><div className="flex gap-2"><Button variant={tab==='plan'?'secondary':'ghost'} disabled={busy} onClick={()=>setTab('plan')}><Target/>Plano de ação</Button><Button variant={tab==='leads'?'secondary':'ghost'} disabled={busy} onClick={()=>setTab('leads')}><Users/>Novos leads</Button></div></div>
  <form onSubmit={generate} className="mt-6 space-y-5">
   <label className="block text-sm">Meu cliente ideal<textarea aria-label="Meu cliente ideal" className={`${inputCls} mt-2 min-h-24`} value={ideal} onChange={e=>setIdeal(e.target.value)} required minLength={15} maxLength={3000}/></label>
   {tab==='plan'?<><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm">Meta de novos salões<input className={`${inputCls} mt-2`} type="number" min="1" max="10000" value={goal} onChange={e=>setGoal(e.target.value)} required/></label><label className="text-sm">Prazo em dias<input className={`${inputCls} mt-2`} type="number" min="1" max="365" value={days} onChange={e=>setDays(e.target.value)} required/></label><label className="text-sm">Horas por semana<input className={`${inputCls} mt-2`} type="number" min="0.5" max="168" step="0.5" value={hours} onChange={e=>setHours(e.target.value)} required/></label></div><label className="block text-sm">Região de atuação<input aria-label="Região de atuação" className={`${inputCls} mt-2`} value={region} onChange={e=>setRegion(e.target.value)} required minLength={2} maxLength={160}/></label><label className="block text-sm">Contexto das vendas<textarea aria-label="Contexto das vendas" className={`${inputCls} mt-2 min-h-28`} value={context} onChange={e=>setContext(e.target.value)} required minLength={15} maxLength={6000}/></label></>:<><div className="grid gap-4 sm:grid-cols-2">{([{key:'salonName',label:'Nome do salão',required:true},{key:'contactName',label:'Nome do contato',required:false},{key:'phone',label:'Telefone',required:false},{key:'city',label:'Cidade',required:false}] as const).map(f=><label className="text-sm" key={f.key}>{f.label}<input aria-label={f.label} className={`${inputCls} mt-2`} value={lead[f.key]} onChange={e=>setLead({...lead,[f.key]:e.target.value})} required={f.required} maxLength={f.key==='phone'?30:160}/></label>)}</div><label className="block text-sm">Contexto do lead<textarea aria-label="Contexto do lead" className={`${inputCls} mt-2 min-h-28`} value={lead.context} onChange={e=>setLead({...lead,context:e.target.value})} required minLength={15} maxLength={6000}/></label></>}
   <div className="flex flex-wrap gap-3"><Button disabled={busy||!!data?.settings?.paused_reason} type="submit">{tab==='plan'?<Sparkles/>:<Plus/>}{busy?'Analisando…':tab==='plan'?'Gerar plano personalizado':'Adicionar e qualificar lead'}</Button>{busy&&<Button type="button" variant="outline" onClick={()=>abort.current?.abort()}><Square/>Interromper</Button>}</div>
  </form>
  {(error||data?.settings?.paused_reason)&&<p role="alert" className="mt-4 border-l-2 border-destructive bg-destructive/10 p-4 text-destructive">{error||data?.settings?.paused_reason}</p>}
  {reasoning&&<details className="mt-5 text-sm text-muted-foreground"><summary className="cursor-pointer">Análise da IA</summary><p className="mt-2 whitespace-pre-wrap">{reasoning}</p></details>}
  {tab==='plan'&&(plan||busy)&&<section className="mt-8 border-t pt-6"><div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-2xl">Seu plano de ação</h3>{plan&&<div className="flex gap-2"><Button size="icon" variant="ghost" aria-label="Copiar plano" title="Copiar plano" onClick={()=>{navigator.clipboard.writeText(plan);toast.success('Plano copiado');}}><Copy/></Button><Button size="icon" variant="ghost" aria-label="Baixar plano" title="Baixar plano" onClick={()=>{const url=URL.createObjectURL(new Blob([plan],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='plano-de-vendas.md';a.click();URL.revokeObjectURL(url);}}><Download/></Button></div>}</div>{!plan&&<p className="animate-pulse text-muted-foreground">Preparando seu plano…</p>}<div className="min-w-0 break-words leading-relaxed"><MessageResponse>{plan}</MessageResponse></div></section>}
  {tab==='leads'&&<div className="mt-8 space-y-4">{data?.leads.map(l=><article key={l.id} className={`rounded-md border p-5 ${l.call_recommended?'border-primary bg-primary/5':'bg-card'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl">{l.salon_name}</h3><p className="text-sm text-muted-foreground">{[l.contact_name,l.city].filter(Boolean).join(' · ')}</p></div><div className="flex items-center gap-3"><span className="text-lg font-semibold text-gold">{l.score===null?'—':`${l.score}/100`}</span>{l.call_recommended&&<span className="flex items-center gap-1 text-sm text-gold"><Phone className="h-4 w-4"/>Vale uma ligação</span>}</div></div><p className="mt-3">{l.summary|| (l.qualification_status==='failed'?'Avaliação não concluída.': 'Aguardando avaliação.')}</p>{l.call_reason&&<p className="mt-2 text-sm text-muted-foreground">{l.call_reason}</p>}{l.qualification_error&&<p className="mt-2 text-sm text-destructive">{l.qualification_error}</p>}{l.phone&&<Button asChild variant="outline" size="sm" className="mt-4"><a href={`tel:${l.phone.replace(/[^+\d]/g,'')}`}><Phone/>Ligar</a></Button>}</article>)}{!data?.leads.length&&<p className="text-muted-foreground">Nenhum lead cadastrado.</p>}</div>}
 </section>;
}