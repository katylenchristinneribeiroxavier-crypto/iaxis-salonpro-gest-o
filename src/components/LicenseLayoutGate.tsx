import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useRouterState } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { verificarLicenca } from '@/lib/license.functions';

export function LicenseLayoutGate({ children }: { children: ReactNode }) {
  const required = useRouterState({ select: state => state.matches.some(m => m.routeId.startsWith('/_authenticated/')) && !['/meus-chamados', '/minha-licenca'].includes(state.location.pathname) });
  const check = useServerFn(verificarLicenca);
  const query = useQuery({ queryKey: ['national-license'], queryFn: () => check(), enabled: required, staleTime: 0, refetchInterval: 30000, retry: false });
  if (!required) return children;
  if (query.isPending) return <p className="p-8 text-muted-foreground">Verificando licença…</p>;
  if (query.error) return <p role="alert" className="p-8 text-destructive">Não foi possível verificar sua licença. Tente novamente.</p>;
  if (!query.data?.permitido) return <Navigate to="/licenca-expirada" replace />;
  return children;
}