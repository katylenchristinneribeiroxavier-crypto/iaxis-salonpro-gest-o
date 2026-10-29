import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const getSupportContact = createServerFn({method:'GET'}).handler(async()=>{
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const r=await supabaseAdmin.from('config_suporte_master').select('whatsapp_master,email_master,nome_suporte').eq('id',1).maybeSingle();
 return r.data ?? {whatsapp_master:'',email_master:'',nome_suporte:'Suporte Técnico'};
});
export const submitPublicTicket=createServerFn({method:'POST'}).inputValidator(z.object({name:z.string().max(100),contact:z.string().min(5).max(150),message:z.string().min(5).max(4000)})).handler(async({data})=>{
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const r=await supabaseAdmin.from('tickets_suporte').insert({user_id:null,nome_cliente:data.name,contato:data.contact,mensagem:data.message,tipo_usuario:'CLIENTE_FINAL',origem:'suporte_publico'}).select('id').single();
 if(r.error)throw new Error('Não foi possível registrar o chamado');return{id:r.data.id};
});