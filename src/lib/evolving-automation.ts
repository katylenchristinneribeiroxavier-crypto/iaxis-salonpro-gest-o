export type ProductionRow = { id: string; date: string; value: number; paid: boolean; commission: number; product_cost: number };
export function productionSummary(rows: ProductionRow[], today: string) {
  const day = new Date(`${today}T12:00:00Z`);
  const monday = new Date(day); monday.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  const weekStart = monday.toISOString().slice(0, 10);
  const total = (r: ProductionRow[]) => r.reduce((s, x) => s + Number(x.value), 0);
  return { daily: total(rows.filter(r => r.date === today)), weekly: total(rows.filter(r => r.date >= weekStart && r.date <= today)), monthly: total(rows.filter(r => r.date.startsWith(today.slice(0, 7)))), annual: total(rows), productMargin: rows.reduce((s, r) => s + Number(r.value) - Number(r.product_cost), 0), months: Array.from({ length: 12 }, (_, i) => { const month = `${today.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`; return { month, value: total(rows.filter(r => r.date.startsWith(month))) }; }) };
}
export function visitPattern(dates: string[]) {
  const days = [...new Set(dates)].sort();
  if (days.length < 2) return null;
  const gaps = days.slice(1).map((d, i) => (Date.parse(d) - Date.parse(days[i] ?? d)) / 86400000);
  return Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
}