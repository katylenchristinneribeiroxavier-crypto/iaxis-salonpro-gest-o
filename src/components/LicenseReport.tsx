import { diasRestantes } from '@/lib/license-rules';

type L = { id: string; email_cliente: string; data_expira: string; status: string; tipo_plano: string; aceitou_termos: boolean };

export function LicenseReport({ licenses }: { licenses: L[] }) {
  const now = new Date();
  const expiradas = licenses.filter(l => l.status === 'bloqueado' || Date.parse(l.data_expira) < now.getTime());
  const proximas = licenses.filter(l => !expiradas.includes(l) && diasRestantes(l.data_expira, now) <= 7);
  const semTermos = licenses.filter(l => !l.aceitou_termos);
  const Card = ({ title, items, tone }: { title: string; items: L[]; tone: string }) => (
    <div className="rounded-lg border border-gold/30 bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-3xl ${tone}`}>{items.length}</p>
      <ul className="mt-3 space-y-1 text-sm">{items.slice(0, 20).map(l => <li key={l.id} className="break-all">{l.email_cliente} <span className="text-muted-foreground">· {new Date(l.data_expira).toLocaleDateString('pt-BR')}</span></li>)}</ul>
    </div>
  );
  return (
    <section className="my-8">
      <h2 className="mb-4 text-2xl">Relatório de licenças</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Expiradas ou bloqueadas" items={expiradas} tone="text-destructive" />
        <Card title="Expiram em até 7 dias" items={proximas} tone="text-gold" />
        <Card title="Termos pendentes" items={semTermos} tone="text-gold" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Termos aceitos: {licenses.length - semTermos.length} de {licenses.length}.</p>
    </section>
  );
}
