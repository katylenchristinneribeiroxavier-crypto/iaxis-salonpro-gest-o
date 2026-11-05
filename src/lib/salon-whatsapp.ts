export function whatsappDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}
export function maskSalonWhatsapp(value: string) {
  const digits = whatsappDigits(value);
  if (!digits) return '';
  if (digits.length < 3) return `(${digits}`;
  const local = digits.slice(2);
  const split = local.length > 8 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? `-${local.slice(split)}` : ''}`;
}
export function salonWhatsappLink(number: string, message: string) {
  const digits = number.replace(/\D/g, '');
  if (!/^\d{10,11}$/.test(digits)) return null;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}