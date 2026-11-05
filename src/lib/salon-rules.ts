export type AgentGender = 'masculino' | 'feminino' | 'neutro';
export function introduction(name: string, salon: string, gender?: AgentGender, article = 'da') {
  const agent = name.trim() || '[NOME QUE VOCÊ DIGITAR]';
  const place = salon.trim() || '[NOME DO SEU SALÃO]';
  if (!name.trim() || !gender) return `Oi, eu sou o/a ${agent}, eu sou o/a secretário(a) ${salon.trim() ? article : 'da'} ${place}`;
  const subject = gender === 'masculino' ? 'o' : gender === 'feminino' ? 'a' : 'elu';
  const occupation = gender === 'masculino' ? 'secretário' : gender === 'feminino' ? 'secretária' : 'assistente';
  return `Oi, eu sou ${subject} ${agent}, eu sou ${subject} ${occupation} ${article} ${place}`;
}
export function splitCommission(total: number, percentage: number) {
  if (!Number.isFinite(total) || total < 0 || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new Error('Valores inválidos');
  const commission = Math.round((total * percentage / 100 + Number.EPSILON) * 100) / 100;
  return { commission, salon: Math.round((total - commission) * 100) / 100 };
}
export function depositAmount(servicePrice: number, type: 'porcentagem' | 'fixo', value: number) {
  if (!Number.isFinite(servicePrice) || servicePrice < 0 || !Number.isFinite(value) || value < 0) throw new Error('Valores inválidos');
  if (type === 'porcentagem') {
    if (value > 100) throw new Error('Valores inválidos');
    return Math.round((servicePrice * value / 100 + Number.EPSILON) * 100) / 100;
  }
  return Math.round((Math.min(value, servicePrice) + Number.EPSILON) * 100) / 100;
}
export function clientCategory(days: number | null, visits: number) {
  if (visits > 10) return 'vip';
  if (days === null) return 'sem_visita';
  if (days <= 30) return 'assidua';
  if (days <= 60) return 'pouco_frequente';
  return 'afastada';
}