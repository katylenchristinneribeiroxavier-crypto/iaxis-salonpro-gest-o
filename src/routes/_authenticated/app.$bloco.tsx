import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { ownerBlocks } from "@/lib/owner-menu";

export const Route = createFileRoute("/_authenticated/app/$bloco")({
  loader: ({ params }) => {
    const b = ownerBlocks.find((x) => x.slug === params.bloco);
    if (!b) throw notFound();
    return b;
  },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.title ?? "Menu"} — IAxis SalonPRO` },
    { name: "description", content: loaderData?.desc ?? "Menu do salão" },
    { property: "og:title", content: `${loaderData?.title ?? "Menu"} — IAxis SalonPRO` },
    { property: "og:description", content: loaderData?.desc ?? "Menu do salão" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: Bloco,
});

function Bloco() {
  const b = Route.useLoaderData();
  return (
    <div className="p-4 sm:p-8">
      <PageTitle title={b.title} sub={b.desc} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {b.links.map((l) => (
          <Link key={l.to} to={l.to} className="rounded-2xl border bg-card p-5 transition hover:border-primary hover:shadow-gold">
            <FolderOpen className="h-7 w-7 text-gold" />
            <h3 className="mt-3 text-lg font-semibold">{l.title}</h3>
            <p className="text-sm text-muted-foreground">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
