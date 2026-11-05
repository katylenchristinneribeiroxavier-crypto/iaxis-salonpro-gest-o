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
function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
const emv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;
const clean = (s: string, max: number) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, max).toUpperCase() || 'PIX';
export function buildPixPayload(key: string, holder: string, city: string, amount: number, txid: string) {
  if (!key.trim()) throw new Error('Chave PIX vazia');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor inválido');
  const gui = emv('00', 'BR.GOV.BCB.PIX') + emv('01', key.trim());
  const tx = clean(txid, 25).replace(/ /g, '') || 'SINAL';
  const body = emv('00', '01') + emv('26', gui) + emv('52', '0000') + emv('53', '986') + emv('54', amount.toFixed(2)) + emv('58', 'BR') + emv('59', clean(holder, 25)) + emv('60', clean(city, 15)) + emv('62', emv('05', tx)) + '6304';
  return body + crc16(body);
}
export function clientCategory(days: number | null, visits: number) {
  if (visits > 10) return 'vip';
  if (days === null) return 'sem_visita';
  if (days <= 30) return 'assidua';
  if (days <= 60) return 'pouco_frequente';
  return 'afastada';
}