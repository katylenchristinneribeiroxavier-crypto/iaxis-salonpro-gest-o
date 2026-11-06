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

/** Lê "1000ml", "1L", "500g", "1kg" do texto da embalagem. */
export function extrairQuantidade(texto: string): { quantidade: number; unidade: 'ml' | 'g' | 'litro' } | null {
  const m = texto.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(ml|kg|g|l|lt|litros?)\b/i);
  if (!m) return null;
  const n = Number(m[1]); const u = m[2].toLowerCase();
  if (u === 'ml') return { quantidade: n, unidade: 'ml' };
  if (u === 'g') return { quantidade: n, unidade: 'g' };
  if (u === 'kg') return { quantidade: n * 1000, unidade: 'g' };
  return { quantidade: n * 1000, unidade: 'ml' };
}

/** Aceita "mais ou menos 200ml", "uns 200", "200,5". */
export function numeroAproximado(valor: string) {
  const m = valor.replace(',', '.').match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
}
