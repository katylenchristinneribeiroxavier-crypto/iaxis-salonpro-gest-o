import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';
import { Brand } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/licenca-expirada')({
  head: () => pageHead('Licença expirada', 'Renove sua licença nacional do IAxis SalonPRO para recuperar o acesso ao salão.'),
  component: () => <div className="min-h-screen bg-gradient-navy p-6"><Brand /><main className="mx-auto max-w-xl py-24 text-center"><ShieldAlert className="mx-auto mb-6 h-14 w-14 text-gold" /><h1 className="text-4xl">Sua licença expirou</h1><p className="mt-5 text-muted-foreground">Sua licença expirou, seus 7 dias grátis acabaram.</p><p className="mt-2 text-sm text-muted-foreground">Se você já renovou, sua licença pode estar vencida ou bloqueada. Seus dados permanecem preservados.</p><Button asChild className="mt-8"><Link to="/assinar">RENOVAR LICENÇA</Link></Button><p className="mt-6"><Link to="/suporte" className="text-sm text-gold underline">Suporte técnico</Link></p></main></div>,
});