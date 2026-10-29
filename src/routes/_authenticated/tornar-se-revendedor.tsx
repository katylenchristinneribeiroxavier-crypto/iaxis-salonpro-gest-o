import {createFileRoute,useNavigate} from '@tanstack/react-router';
import {useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {pageHead} from '@/lib/salon-data';
export const Route=createFileRoute('/_authenticated/tornar-se-revendedor')({head:()=>pageHead('Tornar-se revendedor','Cadastre sua indicação no IAxis SalonPRO.'),component:BecomeReseller});
function BecomeReseller(){const qc=useQueryClient();const navigate=useNavigate();return <main className="mx-auto max-w-3xl p-10"><h1 className="mb-8 text-4xl">Área do revendedor</h1><Button onClick={async()=>{const r=await supabase.rpc('become_reseller');if(r.error){toast.error(r.error.message);return;}await qc.invalidateQueries({queryKey:['me']});navigate({to:'/area-revendedor'});}}>Quero ser revendedor e ganhar 20%</Button></main>;}