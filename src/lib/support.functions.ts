import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
export const getSupportContact = createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY'];const url=process.env['SUPABASE_URL'];if(!key||!url)throw new Error('Configuração indisponível');
 const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const r=await client.rpc('public_support_contact');if(r.error)throw new Error('Suporte indisponível');
 return r.data?.[0] ?? {whatsapp_master:'',email_master:'',nome_suporte:'Suporte Técnico'};
});
export const submitPublicTicket=createServerFn({method:'POST'}).inputValidator(z.object({name:z.string().max(100),contact:z.string().min(5).max(150),message:z.string().min(5).max(4000)})).handler(async({data})=>{
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const r=await supabaseAdmin.from('tickets_suporte').insert({user_id:'00000000-0000-0000-0000-000000000000',nome_cliente:data.name,contato:data.contact,mensagem:data.message,tipo_usuario:'CLIENTE_FINAL',origem:'suporte_publico'}).select('id').single();
 if(r.error)throw new Error('Não foi possível registrar o chamado');return{id:r.data.id};
});