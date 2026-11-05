import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brand, StatusBadge } from "@/components/Shell";
import { brl, useMe, useSignOut } from "@/lib/auth";
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { BRANDING } from '@/constants/branding';
import { BookingAssistant } from '@/components/BookingAssistant';

export const Route = createFileRoute("/cliente")({
  validateSearch: (s: Record<string, unknown>): { s?: string | undefined } => ({ s: typeof s["s"] === "string" ? s["s"] : undefined }),
  head: () => ({ meta: [
    { title: "Agende seu horário — IAxis SalonPRO" },
    { name: "description", content: "Escolha salão, serviço, profissional e horário e pague o sinal online." },
    { property: "og:title", content: "Agende seu horário — IAxis SalonPRO" },
    { property: "og:description", content: "Agendamento online 24h." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Cliente,
});

function Cliente() {
  const { s: slug } = Route.useSearch();
  const me = useMe();
  const signOut = useSignOut();

  const salons = useQuery({
    queryKey: ["salons-public"],
    queryFn: async () => (await supabase.from("salons").select("id, name, slug, city, logo_url, cobrar_sinal, tipo_sinal, valor_sinal, pix_key, pix_holder, pix_city").eq("status", "ativo").order("name")).data ?? [],
  });
  const salon = salons.data?.find((x) => x.slug === slug);
  const contact = useQuery({
    queryKey: ['salon-booking-contact', salon?.id], enabled: !!salon,
    queryFn: async () => {
      if (!salon) return null;
      const result = await supabase.rpc('public_salon_booking_contact', { _salon: salon.id });
      if (result.error) throw result.error;
      return result.data?.[0] ?? null;
    },
  });
  const salonName = contact.data?.nome_salao || salon?.name || '';

  const mine = useQuery({
    queryKey: ["my-appts", me.data?.user.id],
    enabled: !!me.data,
    queryFn: async () => {
      if (!me.data) return [];
      return (await supabase.from("appointments").select("*, salons(name), services(name)").eq("client_id", me.data.user.id).order("starts_at", { ascending: false })).data ?? [];
    },
  });

  const reminders = useQuery({queryKey:['customer-reminders',me.data?.user.id],enabled:!!me.data,refetchInterval:60000,queryFn:async()=>{
    const {data:{user}}=await supabase.auth.getUser();if(!user)return[];
    const own=await supabase.from('appointments').select('id').eq('client_id',user.id);
    if(own.error)throw own.error;if(!own.data.length)return[];
    const r=await supabase.from('fila_mensagens_ia').select('id,mensagem,agendado_para').in('appointment_id',own.data.map(a=>a.id)).lte('agendado_para',new Date().toISOString()).neq('status','cancelado').order('agendado_para',{ascending:false}).limit(10);if(r.error)throw r.error;return r.data;
  }});

  return (
    <div className="min-h-screen bg-gradient-navy">
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-center justify-between">
          {salon ? (
            salon.logo_url
              ? <img src={salon.logo_url} alt={`Logo de ${salon.name}`} className="h-12 w-auto rounded-lg object-contain" />
              : <span className="font-display text-2xl font-semibold">{salonName}</span>
          ) : <Brand />}
          {me.data ? <Button variant="ghost" onClick={signOut}>Sair</Button> : <Button asChild variant="ghost"><Link to="/auth" search={{ role: "cliente" }}>Entrar</Link></Button>}
        </div>

        {!salon ? (
          <>
            <h1 className="mt-8 text-4xl font-semibold">Escolha o salão</h1>
            {salons.data?.length === 0 && <p className="mt-4 text-muted-foreground">Nenhum salão disponível ainda.</p>}
            <div className="mt-4 grid gap-3">
              {salons.data?.map((x) => (
                <Link key={x.id} to="/cliente" search={{ s: x.slug }} className="rounded-xl border bg-card p-5 hover:border-primary">
                  <p className="text-xl font-semibold">{x.name}</p><p className="text-sm text-muted-foreground">{x.city ?? ""}</p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-4xl font-semibold">{salonName}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Agendando no {salonName} - você receberá confirmação no WhatsApp</p>
            {!contact.isPending && !contact.data?.whatsapp_salao && <p className="mt-2 text-sm text-muted-foreground">O salão ainda não cadastrou o WhatsApp para confirmações.</p>}
            <div className="mt-8"><BookingAssistant salonId={salon.id} /></div>
          </>
        )}

        {!!reminders.data?.length && <section className="mt-8 border-t pt-5"><h2 className="flex items-center gap-2 text-2xl"><Bell className="text-gold"/>Meus lembretes</h2>{reminders.data.map(r=><p key={r.id} className="mt-4 border-b pb-4">{r.mensagem}</p>)}</section>}
        {me.data && (mine.data?.length ?? 0) > 0 && (
          <>
            <h2 className="mt-10 mb-3 text-2xl">Meus agendamentos</h2>
            <div className="space-y-2">
              {mine.data?.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm">
                  <div><p className="font-semibold">{(a.services as { name: string } | null)?.name} · {(a.salons as { name: string } | null)?.name}</p>
                    <p className="text-muted-foreground">{new Date(a.starts_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · sinal {brl(Number(a.deposit))}</p></div>
                  <StatusBadge s={a.status} />
                </div>
              ))}
            </div>
          </>
        )}
        <footer className="mt-10 border-t py-4 text-center text-xs text-muted-foreground">{BRANDING.copyright}</footer>
      </div>
    </div>
  );
}
