import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageTitle } from "@/components/Shell";
import { salaoFolders } from "@/lib/modules";

export const Route = createFileRoute("/salao/$pasta")({
  loader: ({ params }) => {
    const folder = salaoFolders.find((f) => f.slug === params.pasta);
    if (!folder) throw notFound();
    return folder;
  },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.title ?? "Pasta"} — IAxis SalonPRO` },
    { name: "description", content: `Pasta ${loaderData?.title}: ${loaderData?.desc}.` },
    { property: "og:title", content: `${loaderData?.title} — IAxis SalonPRO` },
    { property: "og:description", content: loaderData?.desc ?? "" },
  ]}),
  component: Pasta,
});

function Pasta() {
  const f = Route.useLoaderData();
  return (
    <>
      <PageTitle title={f.title} sub={f.desc} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {f.topics.map((t, i) => (
          <div key={t.title} className="rounded-2xl border bg-card p-5">
            <span className="text-xs text-gold">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-1 text-xl font-semibold">{t.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
