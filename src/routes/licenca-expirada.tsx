import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';
import { Brand } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/licenca-expirada')({
  head: () => pageHead('Licença expirada', 'Renove sua licença nacional do IAxis SalonPRO para recuperar o acesso ao salão.'),
  component: LicencaExpirada,
});

function LicencaExpirada() {
  return (
    <div className="min-h-screen bg-gradient-navy p-6">
      <Brand />
      <main className="mx-auto max-w-xl py-20">
        <div className="rounded-2xl border border-gold/40 bg-card/80 p-10 text-center shadow-2xl">
          <ShieldAlert className="mx-auto mb-6 h-16 w-16 text-gold" />
          <h1 className="text-4xl">Sua licença expirou</h1>
          <p className="mt-5 text-lg text-muted-foreground">Seus 7 dias grátis acabaram. Renove para continuar usando o iAxis SalonPro</p>
          <p className="mt-3 text-sm text-muted-foreground">Seus dados continuam preservados e voltam a ficar disponíveis assim que o pagamento for confirmado.</p>
          <Button asChild size="lg" className="mt-8"><Link to="/minha-licenca">Renovar minha licença agora</Link></Button>
          <p className="mt-6"><Link to="/suporte" className="text-sm text-gold underline">Falar com o suporte</Link></p>
        </div>
      </main>
    </div>
  );
}
