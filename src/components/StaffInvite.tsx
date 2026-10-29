import { useState } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { salonContextOptions } from '@/lib/salon-data';
import { inviteStaff } from '@/lib/staff.functions';
import { supabase } from '@/integrations/supabase/client';
import { inputCls } from './Shell';
import { Button } from './ui/button';
export function StaffInvite(){const{data:ctx}=useSuspenseQuery(salonContextOptions);const fn=useServerFn(inviteStaff);const[email,setEmail]=useState('');const[professional,setProfessional]=useState('');const[access,setAccess]=useState<'ADMIN'|'PROFISSIONAL'>('PROFISSIONAL');const[busy,setBusy]=useState(false);
const{data:pros=[]}=useQuery({queryKey:['records','professionals',ctx.salon?.id],enabled:!!ctx.salon,queryFn:async()=>{if(!ctx.salon)return[];return(await supabase.from('professionals').select('*').eq('salon_id',ctx.salon.id)).data??[];}});
return <section className="mt-10 border-t pt-6"><h2 className="mb-4 text-2xl">Acesso do funcionário</h2><form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={async e=>{e.preventDefault();if(!ctx.salon)return;setBusy(true);try{await fn({data:{salonId:ctx.salon.id,professionalId:professional,email,access}});toast.success('Convite enviado por e-mail');setEmail('');}catch(err){toast.error(err instanceof Error?err.message:'Não foi possível enviar');}finally{setBusy(false);}}}><input aria-label="E-mail do funcionário" type="email" required className={inputCls} value={email} onChange={e=>setEmail(e.target.value)}/><select aria-label="Funcionário para convite" required className={inputCls} value={professional} onChange={e=>setProfessional(e.target.value)}><option value="">Selecionar funcionário</option>{pros.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select aria-label="Tipo de acesso" className={inputCls} value={access} onChange={e=>setAccess(e.target.value==='ADMIN'?'ADMIN':'PROFISSIONAL')}><option value="PROFISSIONAL">Profissional</option><option value="ADMIN">Administrador do salão</option></select><Button disabled={busy} type="submit"><Mail/>Enviar convite</Button></form></section>;
}