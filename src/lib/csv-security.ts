/** Keep each value in one cell and prevent spreadsheet formula execution. */
export function csvCell(value: unknown): string {
  const text = String(value ?? '');
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const dangerous = /^[\s\u0000-\u001f\u007f]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text);
  const safe = !numeric && dangerous ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}