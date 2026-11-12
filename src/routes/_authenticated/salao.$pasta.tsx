import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { salaoFolders } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/salao/$pasta")({
  loader: ({ params }) => {
    const folder = salaoFolders.find((f) => f.slug === params.pasta);
    if (!folder) throw notFound();
    const destinations: Record<string,string> = {agendamento:'/agenda-do-dia',automacao:'/lembretes',operacao:'/produtos',financeiro:'/financeiro-comissoes',clientes:'/clientes-categorias',escala:'/clientes-cuidado',mobilidade:'/suporte'};
    const to = destinations[params.pasta];
    if (to) throw redirect({ to });
    throw notFound();
  },
});
