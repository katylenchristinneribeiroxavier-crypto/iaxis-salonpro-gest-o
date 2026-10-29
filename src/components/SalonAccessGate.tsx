import {useQuery} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';
import type {ReactNode} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {accessOpen} from '@/lib/salon-access';
import {Button} from './ui/button';
export function SalonAccessGate({children}:{children:ReactNode}){
 const {data,isPending,error}=useQuery({queryKey:['salon-access'],refetchInterval:30000,queryFn:async()=>{
  const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Entre na sua conta');
  const roles=await supabase.from('user_roles').select('role').eq('user_id',user.id);if(roles.error)throw roles.error;
  if(roles.data.some(r=>r.role==='super_admin'))return null;
  const own=await supabase.from('salons').select('*').eq('owner_id',user.id).maybeSingle();if(own.error)throw own.error;
  if(own.data)return own.data;
  const m=await supabase.from('salon_members').select('salon_id').eq('user_id',user.id).limit(1).maybeSingle();if(m.error)throw m.error;
  if(!m.data)return null;
  const s=await supabase.from('salons').select('*').eq('id',m.data.salon_id).maybeSingle();if(s.error)throw s.error;return s.data;
 }});
 if(isPending)return <p className="p-8 text-muted-foreground">Verificando acesso…</p>;
 if(error)return <p role="alert" className="p-8 text-destructive">Não foi possível verificar seu acesso.</p>;
 if(data&&!accessOpen(data))return <section className="p-8"><h1 className="text-3xl">Acesso temporariamente bloqueado</h1><p className="mt-3">{data.name}</p><p className="mt-2 text-muted-foreground">{data.block_reason}</p><Button asChild className="mt-5"><Link to="/acesso-bloqueado">Falar com suporte técnico</Link></Button></section>;
 if(data&&data.status!=='ativo')return <section className="p-8"><h1 className="text-3xl">Assinatura pendente</h1><Button asChild className="mt-5"><Link to="/assinar">Regularizar pagamento</Link></Button></section>;
 return children;
}