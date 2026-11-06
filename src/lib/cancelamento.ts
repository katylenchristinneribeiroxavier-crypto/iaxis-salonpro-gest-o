export const CANCEL_MIN_HOURS_PADRAO = 2;

/** Cliente só cancela com pelo menos `horas` de antecedência (padrão 2h). */
export function podeCancelar(inicio: string | Date, agora: Date = new Date(), horas: number = CANCEL_MIN_HOURS_PADRAO): boolean {
  return new Date(inicio).getTime() - agora.getTime() >= horas * 3600_000;
}

export function mensagemVagaAberta(salao: string | null | undefined, inicio: string): string {
  const hora = new Date(inicio).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  return `Olá! Abriu vaga no salão ${salao ?? ''} no horário ${hora} que você queria! Quer agendar?`;
}
