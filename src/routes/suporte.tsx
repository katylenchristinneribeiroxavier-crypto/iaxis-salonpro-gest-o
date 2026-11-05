import {createFileRoute,Link} from '@tanstack/react-router';
import {SupportForm} from '@/components/Support';
import {Brand} from '@/components/Shell';
import {pageHead} from '@/lib/salon-data';
import {Button} from '@/components/ui/button';
import {BRANDING} from '@/constants/branding';
export const Route=createFileRoute('/suporte')({head:()=>pageHead('Suporte técnico','Fale com o suporte técnico da plataforma IAxis SalonPRO.'),component:()=> <div className="min-h-screen bg-gradient-navy p-6"><div className="mx-auto max-w-4xl"><div className="flex flex-wrap items-center justify-between gap-4"><Brand/><Button asChild variant="outline"><Link to="/meus-chamados">Meus chamados</Link></Button></div><div className="mt-10"><SupportForm/></div><footer className="mt-10 border-t py-4 text-center text-xs text-muted-foreground">{BRANDING.copyright}</footer></div></div>});