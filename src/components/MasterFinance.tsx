import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageTitle, Stat, inputCls } from './Shell';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { brl } from '@/lib/auth';
import { z } from 'zod';
import { csvCell } from '@/lib/csv-security';

type Mov = { id: string; salon_id: string | null; nome_salao: string; tipo: string; descricao: string; valor: number; valor_liquido: number; taxa: number; forma_pagamento: string; status: string; data_recebimento: string; mes_referencia: string };

const TIPOS: Record<string, string> = {
  entrada_assinatura_mensal: 'Assinatura mensal', entrada_assinatura_anual: 'Assinatura anual',
  entrada_taxa_setup: 'Taxa de setup', reembolso: 'Reembolso',
  saida_despesa_app: 'Despesa do app', saida_comissao_revendedor: 'Comissão de revendedor',
};

export function MasterFinance() {
  const qc = useQueryClient();
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [valor, setValor] = useState('');
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ['master-finance'],
    queryFn: async () => {
      const [m, s] = await Promise.all([
        supabase.from('caixa_master_saas').select('*').order('data_recebimento', { ascending: false }),
        supabase.from('salons').select('id, name, status').eq('status', 'ativo'),
      ]);
      if (m.error) throw m.error;
      if (s.error) throw s.error;
      return { rows: (m.data ?? []) as Mov[], pagantes: s.data?.length ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const recebidas = rows.filter((r) => r.status === 'recebido');
  const mesAtual = new Date().toISOString().slice(0, 7);
  const faturamento = recebidas.filter((r) => r.valor > 0).reduce((s, r) => s + Number(r.valor_liquido), 0);
  const mrr = recebidas.filter((r) => r.mes_referencia === mesAtual && r.valor > 0).reduce((s, r) => s + Number(r.valor_liquido), 0);
  const despesas = recebidas.filter((r) => r.tipo === 'saida_despesa_app').reduce((s, r) => s + Math.abs(Number(r.valor)), 0);
  const pagantes = data?.pagantes ?? 0;

  const filtradas = rows.filter((r) => (!month || r.mes_referencia === month) && (!status || r.status === status));

  const exportar = () => {
    const csv = [['Data', 'Salão', 'Tipo', 'Descrição', 'Valor', 'Líquido', 'Status'], ...filtradas.map((r) => [r.data_recebimento, r.nome_salao, TIPOS[r.tipo] ?? r.tipo, r.descricao, Number(r.valor), Number(r.valor_liquido), r.status])].map(row => row.map(csvCell).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'meu-financeiro.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const lancarDespesa = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const parsed = z.object({ description: z.string().trim().min(1).max(1000), amount: z.coerce.number().finite().positive() }).safeParse({ description: desc, amount: valor });
    if (!parsed.success) { toast.error('Informe descrição de até 1000 caracteres e valor maior que zero.'); return; }
    const v = parsed.data.amount;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const r = await supabase.from('caixa_master_saas').insert({
      tipo: 'saida_despesa_app', descricao: parsed.data.description, valor: -v, valor_liquido: -v,
      status: 'recebido', criado_por: u.user?.id ?? null,
    });
    setBusy(false);
    if (r.error) { toast.error(r.error.message); return; }
    toast.success('Despesa lançada');
    setOpen(false); setDesc(''); setValor('');
    await qc.invalidateQueries({ queryKey: ['master-finance'] });
  };

  return <>
    <PageTitle title="Meu caixa master — dona do app" sub="Todo o dinheiro que entra dos salões que pagam o app" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Stat label="Faturamento total acumulado" value={brl(faturamento)} />
      <Stat label="MRR — receita do mês atual" value={brl(mrr)} />
      <Stat label="Salões pagantes hoje" value={String(pagantes)} />
      <Stat label="Ticket médio" value={brl(pagantes ? mrr / pagantes : 0)} />
      <Stat label="Minhas despesas" value={brl(despesas)} />
      <Stat label="Lucro líquido" value={brl(faturamento - despesas)} />
    </div>

    <div className="mt-6 flex flex-wrap gap-3">
      <input aria-label="Filtrar por mês" type="month" className={`${inputCls} max-w-48`} value={month} onChange={(e) => setMonth(e.target.value)} />
      <select aria-label="Filtrar por status" className={`${inputCls} max-w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Todos os status</option><option value="recebido">Recebido</option><option value="pendente">Pendente</option><option value="falhou">Falhou</option><option value="reembolsado">Reembolsado</option>
      </select>
      <Button variant="outline" onClick={exportar}><Download />Exportar</Button>
      <Button onClick={() => setOpen(true)}><Plus />Lançar despesa minha</Button>
    </div>

    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-muted-foreground">{['Data', 'Salão', 'Tipo', 'Descrição', 'Valor', 'Líquido', 'Status'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{filtradas.map((r) => <tr key={r.id} className="border-b">
          <td className="p-3">{new Date(`${r.data_recebimento}T12:00:00`).toLocaleDateString('pt-BR')}</td>
          <td className="p-3">{r.nome_salao || '—'}</td>
          <td className="p-3">{TIPOS[r.tipo] ?? r.tipo}</td>
          <td className="p-3">{r.descricao}</td>
          <td className={`p-3 ${Number(r.valor) < 0 ? 'text-destructive' : 'text-gold'}`}>{brl(Number(r.valor))}</td>
          <td className="p-3">{brl(Number(r.valor_liquido))}</td>
          <td className="p-3 capitalize">{r.status}</td>
        </tr>)}</tbody>
      </table>
      {!filtradas.length && <p className="py-8 text-muted-foreground">Nenhum lançamento encontrado. As entradas de assinatura aparecem aqui quando você confirmar pagamentos no painel de planos.</p>}
    </div>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Lançar despesa minha</DialogTitle>
        <DialogDescription>Ex.: ferramentas, hospedagem, anúncios. O valor entra como saída no seu caixa.</DialogDescription>
        <form className="space-y-4" onSubmit={lancarDespesa}>
          <label className="block text-sm">Descrição<input className={`${inputCls} mt-2`} required minLength={3} maxLength={1000} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
          <label className="block text-sm">Valor (R$)<input className={`${inputCls} mt-2`} type="number" min="0.01" step="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} /></label>
          <Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Lançar despesa'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
