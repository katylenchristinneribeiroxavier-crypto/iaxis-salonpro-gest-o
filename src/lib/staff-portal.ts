export function staffPortalLink(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/f/${token}`;
}

export function staffAccessMessage(nome: string, salao: string, link: string, logoUrl?: string) {
  const texto = `Oi ${nome.trim()}! Seu acesso pessoal do ${salao.trim()}: ${link}`;
  return logoUrl ? `${texto}\n\n${logoUrl}` : texto;
}

export function staffAccessWhatsApp(whatsapp: string, mensagem: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`;
}
