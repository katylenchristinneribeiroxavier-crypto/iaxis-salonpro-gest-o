import { easter } from 'date-easter';
export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export type CalendarEvent = { key: string; date: string; name: string; kind: string; message: string | null };
export function brazilCalendar(year: number): CalendarEvent[] {
  if (!Number.isInteger(year) || year < 1900 || year > 2199) throw new Error('Ano inválido');
  const e = easter(year);
  const offset = (days: number) => new Date(Date.UTC(e.year, e.month - 1, e.day + days)).toISOString().slice(0, 10);
  const fixed = (md: string) => `${year}-${md}`;
  const mothers = new Date(Date.UTC(year, 4, 1));
  const mothersDay = 1 + (7 - mothers.getUTCDay()) % 7 + 7;
  const optional = year === 2026 ? 'Ponto facultativo federal' : 'Data tradicional · portaria anual a confirmar';
  const events: CalendarEvent[] = [];
  const add = (key: string, date: string, name: string, kind: string, message: string | null = null) => events.push({ key, date, name, kind, message });
  add('ano-novo', fixed('01-01'), 'Confraternização Universal', 'Feriado nacional', 'Que este novo ciclo traga saúde, encontros felizes e novas oportunidades. Desejamos um ano leve, cheio de carinho e bons recomeços!');
  add('carnaval-segunda', offset(-48), 'Carnaval · segunda-feira', optional);
  add('carnaval', offset(-47), 'Carnaval', optional, 'Que seu Carnaval tenha alegria, descanso e cuidado com você. Seja na folia ou na tranquilidade, desejamos dias leves e cheios de boas lembranças!');
  add('cinzas', offset(-46), 'Quarta-feira de Cinzas', year === 2026 ? 'Ponto facultativo federal até 14h' : optional);
  add('mulher', fixed('03-08'), 'Dia Internacional da Mulher', 'Data comemorativa', 'Hoje celebramos as mulheres, suas histórias e conquistas. Que não faltem respeito, liberdade e oportunidades todos os dias. Receba nosso carinho!');
  add('paixao', offset(-2), 'Sexta-feira da Paixão', 'Religioso · feriado local conforme lei municipal');
  add('pascoa', offset(0), 'Páscoa', 'Data religiosa', 'Que esta Páscoa renove a esperança e traga paz, afeto e momentos doces ao lado de quem faz bem. Desejamos um dia acolhedor para você!');
  add('tiradentes', fixed('04-21'), 'Tiradentes', 'Feriado nacional');
  add('trabalho', fixed('05-01'), 'Dia do Trabalho', 'Feriado nacional');
  add('maes', fixed(`05-${String(mothersDay).padStart(2, '0')}`), 'Dia das Mães', 'Data comemorativa', 'Neste Dia das Mães, nosso carinho a quem cuida, acolhe e faz parte dessa história. Que o dia traga afeto e boas lembranças, respeitando cada caminho e cada sentimento.');
  add('corpus', offset(60), 'Corpus Christi', optional + ' · pode ser feriado local');
  add('namorados', fixed('06-12'), 'Dia dos Namorados', 'Data comemorativa', 'Que o amor esteja nos pequenos gestos, no respeito e na companhia que faz bem. Neste Dia dos Namorados, desejamos carinho e momentos felizes, em todas as formas de amar!');
  add('independencia', fixed('09-07'), 'Independência do Brasil', 'Feriado nacional');
  add('aparecida', fixed('10-12'), 'Nossa Senhora Aparecida', 'Feriado nacional');
  add('finados', fixed('11-02'), 'Finados', 'Feriado nacional');
  add('republica', fixed('11-15'), 'Proclamação da República', 'Feriado nacional');
  add('consciencia', fixed('11-20'), 'Dia de Zumbi e da Consciência Negra', year >= 2024 ? 'Feriado nacional' : 'Data comemorativa');
  add('natal', fixed('12-25'), 'Natal', 'Feriado nacional', 'Que seu Natal seja acolhedor, com paz e carinho nos pequenos momentos. Agradecemos por fazer parte da nossa história e desejamos dias cheios de afeto!');
  add('fim-ano', fixed('12-31'), 'Véspera de Ano-Novo', 'Data comemorativa', 'Agradecemos pela sua companhia neste ano. Que o próximo ciclo abra novas oportunidades, com saúde, esperança e tempo para cuidar de você. Um lindo recomeço!');
  return events.sort((a, b) => a.date.localeCompare(b.date));
}
export function occasionMessage(message: string, client: string, salon: string) {
  return `Olá${client.trim() ? `, ${client.trim()}` : ''}! ${message}${salon.trim() ? ` Com carinho, equipe ${salon.trim()}.` : ''}`;
}
export function specialMessageKey(salon: string, client: string, event: CalendarEvent) {
  return `special:${salon}:${client}:${event.date}:${event.key}`;
}