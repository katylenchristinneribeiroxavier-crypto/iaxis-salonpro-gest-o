export function waDigits(phone: string | null | undefined): string {
  const d = (phone ?? '').replace(/\D/g, '');
  if (!d) return '';
  return d.length <= 11 ? `55${d}` : d;
}

export function mensagemConfirmacao(p: { cliente: string; salao?: string | null; servico?: string | null; profissional?: string | null; inicio: string }): string {
  const dt = new Date(p.inicio);
  const data = dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const partes = [`Olá, ${p.cliente}! ✨`, `Seu horário${p.salao ? ` no ${p.salao}` : ''} está agendado para ${data} às ${hora}.`];
  if (p.servico) partes.push(`Serviço: ${p.servico}${p.profissional ? ` com ${p.profissional}` : ''}.`);
  partes.push('Responda SIM para confirmar ou NÃO para remarcar.');
  return partes.join('\n');
}

export function linkWhatsApp(phone: string | null | undefined, texto: string): string | null {
  const d = waDigits(phone);
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(texto)}` : null;
}
