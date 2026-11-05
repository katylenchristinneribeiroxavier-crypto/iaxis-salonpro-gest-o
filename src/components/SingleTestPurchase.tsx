import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { inputCls } from './Shell';

export function SingleTestPurchase() {
  const qc=useQueryClient();const[name,setName]=useState('');const[city,setCity]=useState('');const[busy,setBusy]=useState(false);
  const{data,isPending,isError}=useQuery({queryKey:['single-test-purchase'],queryFn:async()=>{const r=await supabase.from('platform_test_purchase').select('salon_id,redeemed_at').maybeSingle();if(r.error)throw r.error;return r.data;}});
  return <section className="mt-8 border-t pt-6"><h2 className="flex items-center gap-2 text-2xl"><FlaskConical className="text-gold"/>Compra gratuita de teste</h2>{isPending?<p className="mt-4">Carregando…</p>:isError?<p role="alert">Não foi possível consultar a compra de teste.</p>:data?<div className="mt-4"><p>Única compra gratuita utilizada em {new Date(data.redeemed_at).toLocaleDateString('pt-BR')}.</p><Button asChild className="mt-4"><Link to="/gestao-salao">Abrir salão de teste</Link></Button></div>:<form className="mt-5 max-w-xl space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const r=await supabase.rpc('redeem_single_test_purchase',{_name:name.trim(),_city:city.trim()});if(r.error)throw r.error;await Promise.all([qc.invalidateQueries({queryKey:['single-test-purchase']}),qc.invalidateQueries({queryKey:['salon-context']}),qc.invalidateQueries({queryKey:['admin']})]);toast.success('Única compra gratuita liberada');}catch(error){toast.error(error instanceof Error?error.message:'Não foi possível liberar');}finally{setBusy(false);}}}><p className="text-sm text-muted-foreground">Uma única compra de R$ 0,00 com acesso ao plano completo, sem faturamento ou comissão.</p><label className="block text-sm">Nome do salão de teste<input aria-label="Nome do salão de teste" maxLength={100} value={name} onChange={e=>setName(e.target.value)} className={`${inputCls} mt-2`}/></label><label className="block text-sm">Cidade<input maxLength={100} value={city} onChange={e=>setCity(e.target.value)} className={`${inputCls} mt-2`}/></label><Button type="submit" disabled={busy}><FlaskConical/>{busy?'Liberando…':'Usar a única compra gratuita'}</Button></form>}</section>;
}