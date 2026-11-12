import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { brl } from '@/lib/auth';
import { Button } from './ui/button';
import { inputCls } from './Shell';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
export function ReferralPayout({ sale }: {sale:{id:string;commission:number;paid_amount:number;status:string}}) {
  const [open,setOpen]=useState(false);
  const [amount,setAmount]=useState('1');
  const [busy,setBusy]=useState(false);
  const qc=useQueryClient();
  const remaining=Math.round((sale.commission-sale.paid_amount)*100)/100;
  return <><Button variant="outline" size="sm" disabled={sale.status!=='pendente_a_pagar'||remaining<=0} onClick={()=>setOpen(true)}>Registrar repasse</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Registrar repasse parcial</DialogTitle><DialogDescription>Saldo atual: {brl(remaining)}</DialogDescription><form className="space-y-4" onSubmit={async e=>{
    e.preventDefault();setBusy(true);
    const r=await supabase.rpc('pay_referral_amount',{_sale:sale.id,_amount:Number(amount)});
    setBusy(false);
    if(r.error){toast.error(r.error.message);return;}
    toast.success(`Repasse registrado. Saldo restante: ${brl(r.data)}`);setOpen(false);
    await qc.invalidateQueries({queryKey:['referral-sales']});
    await qc.invalidateQueries({queryKey:['owner-partnership']});
  }}><label className="block text-sm">Valor do repasse (R$)<input required type="number" min="0.01" max={remaining} step="0.01" className={`${inputCls} mt-2`} value={amount} onChange={e=>setAmount(e.target.value)}/></label><Button type="submit" disabled={busy||Number(amount)<=0||Number(amount)>remaining}>Confirmar {brl(Number(amount)||0)}</Button></form></DialogContent></Dialog></>;
}