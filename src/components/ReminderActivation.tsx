import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Bell, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getReminderControl, setReminderControl } from '@/lib/salon-automation.functions';
import { Button } from './ui/button';

export function ReminderActivation() {
 const get=useServerFn(getReminderControl);const set=useServerFn(setReminderControl);const qc=useQueryClient();const[busy,setBusy]=useState(false);
 const{data,isError}=useQuery({queryKey:['reminder-control'],queryFn:()=>get()});
 return <section className="mt-8 border-t pt-6"><h2 className="flex items-center gap-2 text-2xl"><Bell className="text-gold"/>Ativação de lembretes</h2>{isError?<p role="alert">Não foi possível consultar a ativação.</p>:<><dl className="my-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt>Envios externos</dt><dd className="mt-1 text-gold">{data?.enabled?'Habilitados':'Pausados'}</dd></div><div><dt>Execução programada</dt><dd className="mt-1 text-muted-foreground">{data?.schedulerReady?'Proteção preparada':'Aguardando configuração após publicação'}</dd></div></dl><p className="mb-5 text-sm text-muted-foreground">Lembretes no app e fila preparados. Antes de enviar: publicar, validar Evolution, conectar o número do salão e configurar a execução programada.</p><Button variant="outline" disabled={busy||!data||(!data.enabled&&!data.schedulerReady)} onClick={async()=>{setBusy(true);try{await set({data:{enabled:!data?.enabled}});await qc.invalidateQueries({queryKey:['reminder-control']});toast.success('Ativação atualizada');}catch(error){toast.error(error instanceof Error?error.message:'Não foi possível alterar');}finally{setBusy(false);}}}><ShieldCheck/>{data?.enabled?'Pausar envios':'Habilitar após publicação'}</Button></>}</section>;
}