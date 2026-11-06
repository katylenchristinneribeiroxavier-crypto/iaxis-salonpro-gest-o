import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn, ShieldCheck, Undo2 } from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';
import { MasterAccess } from '@/components/MasterAccess';
import { Brand } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/_authenticated/criador')({
  head: () => { const h = pageHead('Área do criador', 'Acesso restrito.'); return { meta: [...h.meta, { name: 'robots', content: 'noindex, nofollow' }] }; },
  component: () => <RoleGate role="super_admin"><Criador /></RoleGate>,
});

function Criador() {
  const qc = useQueryClient(); const navigate = useNavigate();
  const salons = useQuery({ queryKey: ['criador-salons'], queryFn: async () => { const r = await supabase.from('salons').select('id,name,city,status,access_enabled,created_at').order('created_at', { ascending: false }); if (r.error) throw r.error; return r.data; } });
  const current = typeof window !== 'undefined' ? window.localStorage.getItem('criador_salon') : null;
  const enter = async (id: string | null) => {
    if (id) window.localStorage.setItem('criador_salon', id); else window.localStorage.removeItem('criador_salon');
    await qc.invalidateQueries(); if (id) navigate({ to: '/app' });
  };
  return <div className="min-h-screen bg-gradient-navy p-6 md:p-10"><Brand /><main className="mx-auto mt-10 max-w-5xl">
    <h1 className="flex items-center gap-3 text-4xl"><ShieldCheck className="text-gold" />Área do criador</h1>
    <p className="mt-2 text-muted-foreground">Entre em qualquer salão com acesso total para corrigir cadastros, sem a senha da cliente.</p>
    {current && <Button variant="outline" className="mt-4" onClick={() => enter(null)}><Undo2 />Sair do salão atual</Button>}
    <ul className="mt-6 divide-y rounded-lg border bg-card">{salons.data?.map((s) => <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-48 flex-1"><p className="text-lg">{s.name || 'Sem nome'}</p><p className="text-sm text-muted-foreground">{s.city || '—'} · {s.access_enabled ? 'liberado' : 'bloqueado'}{current === s.id ? ' · você está aqui' : ''}</p></div>
      <Button onClick={() => enter(s.id)}><LogIn />ENTRAR NESTE SALÃO</Button>
    </li>)}{salons.isPending && <li className="p-4">Carregando…</li>}</ul>
    <section className="mt-10"><h2 className="mb-4 text-2xl">Bloquear / liberar salões</h2><MasterAccess /></section>
  </main></div>;
}
