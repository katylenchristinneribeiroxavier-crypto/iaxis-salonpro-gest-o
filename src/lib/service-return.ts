export function serviceDefaults(name: string) {
  const n = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/progressiva|botox|selagem/.test(n)) return { days: 30, rule: 'progressiva', oldDays: 90 };
  if (/mecha|luzes/.test(n)) return { days: 60, rule: 'fixa', oldDays: 60 };
  if (/sobrancelha/.test(n)) return { days: 15, rule: 'fixa', oldDays: 15 };
  if (/raiz|coloracao|tintura/.test(n)) return { days: 20, rule: 'fixa', oldDays: 20 };
  if (/unha|mao|\bpe\b|alongamento|esmaltacao|manicure|pedicure/.test(n)) return { days: 14, rule: 'fixa', oldDays: 14 };
  if (/corte/.test(n)) return { days: 45, rule: 'fixa', oldDays: 45 };
  return { days: 30, rule: 'fixa', oldDays: 30 };
}
export function returnDays(days: number, rule: string, oldDays: number, visits: number, first: string, last: string) {
  const threshold = new Date(`${first.slice(0, 10)}T12:00:00Z`);
  threshold.setUTCMonth(threshold.getUTCMonth() + 3);
  return rule === 'progressiva' && visits > 3 && new Date(`${last.slice(0, 10)}T12:00:00Z`) > threshold ? oldDays : days;
}
export function addReturnDays(date: string, days: number) {
  const d = new Date(`${date.slice(0,10)}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10);
}
export type ClientImportRow = { name: string; phone: string; service: string; date: string };
export const importAliases = {
  name: ['nome', 'cliente', 'nomecliente', 'nomedocliente', 'nomedacliente', 'nomecompleto'],
  phone: ['telefone', 'celular', 'whatsapp', 'fone', 'telefonedocliente', 'telefonedacliente'],
  service: ['ultimoservico', 'servico', 'servicorealizado', 'procedimento'],
  date: ['datadoultimoatendimento', 'ultimavisita', 'ultimoatendimento', 'dataultimoatendimento', 'data', 'datadoatendimento'],
};
export const normalizeHeader = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function importDate(value: unknown) {
  if (value instanceof Date) return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
  const raw = String(value ?? '').trim();
  const br = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s.*)?$/);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  const date = br ? `${br[3]}-${br[2]?.padStart(2,'0')}-${br[1]?.padStart(2,'0')}` : iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : '';
  return date && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) === date ? date : '';
}
export function normalizeImportPhone(value: unknown) {
  let p = String(value ?? '').replace(/\D/g,''); if (p.length === 10 || p.length === 11) p = `55${p}`;
  return /^55\d{10,11}$/.test(p) ? p : '';
}