export type License = { data_expira: string; status: string; tipo_plano: string; ultimo_pagamento: string | null };
export const LICENSE_DAYS = { teste: 7, mensal: 30, anual: 365 } as const;
export function verificarLicenca(license: License, now: Date): boolean {
  if (license.status === 'bloqueado') return false;
  const expiration = Date.parse(license.data_expira);
  if (!Number.isFinite(expiration)) return false;
  if (expiration < now.getTime() && license.status !== 'pago') return false;
  if (license.ultimo_pagamento) {
    const payment = Date.parse(license.ultimo_pagamento);
    const days = license.tipo_plano === 'anual' ? LICENSE_DAYS.anual : LICENSE_DAYS.mensal;
    return Number.isFinite(payment) && payment + days * 86400000 >= now.getTime();
  }
  return license.status !== 'pago' && expiration >= now.getTime();
}
export function diasRestantes(dataExpira: string, now: Date): number {
  const t = Date.parse(dataExpira);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.ceil((t - now.getTime()) / 86400000));
}
