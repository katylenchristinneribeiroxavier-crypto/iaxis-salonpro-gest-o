import { useRouter, useRouterState } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { showsBack } from '@/lib/navigation';

export function PageBack() {
  const router = useRouter();
  const path = useRouterState({ select: s => s.location.pathname });
  if (!showsBack(path)) return null;
  return <div className="border-b bg-background px-4 py-2 sm:px-6"><Button variant="ghost" size="sm" onClick={() => {
    if (router.history.canGoBack()) router.history.back();
    else void router.navigate({ to: '/' });
  }}><ArrowLeft className="size-4" />Voltar</Button></div>;
}