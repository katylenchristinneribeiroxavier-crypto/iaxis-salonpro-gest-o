export type Semaforo = 'verde' | 'amarelo' | 'vermelho';

export function semaforo(atual: number, minima: number): Semaforo {
  if (atual > minima) return 'verde';
  if (atual === minima) return 'amarelo';
  return 'vermelho';
}

export function usosRestantes(atual: number, consumo: number) {
  return consumo > 0 ? Math.floor(atual / consumo) : null;
}

export function estoqueBaixo(atual: number, minima: number) {
  return atual <= minima;
}

export function resumoEstoque(p: { quantidade_atual: number; unidade: string; consumo_por_servico: number; servico_relacionado: string }) {
  const usos = usosRestantes(Number(p.quantidade_atual), Number(p.consumo_por_servico));
  const base = `Restam ${Number(p.quantidade_atual)}${p.unidade === 'unidade' ? ' un.' : p.unidade}`;
  if (usos === null) return base;
  const svc = (p.servico_relacionado || 'serviço').toLowerCase();
  return `${base} = ${usos} ${usos === 1 ? svc : svc.endsWith('s') ? svc : svc + 's'}`;
}

export function pedidoWhatsApp(whatsapp: string, fornecedor: string, produto: string, salao?: string | undefined) {
  const digits = whatsapp.replace(/\D/g, '');
  const text = `Olá ${fornecedor}, preciso repor ${produto}${salao ? ` para o salão ${salao}` : ''}. Pode me passar valor e prazo?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
