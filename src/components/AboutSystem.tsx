import { BRANDING } from '@/constants/branding';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AboutSystem() {
  return (
    <Card className="mt-8 max-w-3xl">
      <CardHeader><CardTitle>Sobre o sistema</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><b>Aplicativo:</b> {BRANDING.appName} — Gestão para Salões</p>
        <p><b>Desenvolvedora:</b> {BRANDING.devName}</p>
        <p><b>Versão:</b> 1.0 — Online</p>
        <p className="pt-2 text-muted-foreground">Sistema criado e mantido por {BRANDING.devName}. Proibida cópia não autorizada.</p>
      </CardContent>
    </Card>
  );
}
