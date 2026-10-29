import {createFileRoute,Link} from '@tanstack/react-router';
import {LockKeyhole} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {pageHead} from '@/lib/salon-data';
export const Route=createFileRoute('/acesso-bloqueado')({head:()=>pageHead('Acesso bloqueado','Regularize seu acesso com o suporte técnico do IAxis SalonPRO.'),component:()=> <main className="mx-auto max-w-3xl p-10"><LockKeyhole className="mb-6 h-12 w-12 text-gold"/><h1 className="text-4xl">Acesso temporariamente bloqueado</h1><p className="my-5 text-muted-foreground">Seu acesso foi cortado pela administração. Entre em contato com o suporte técnico para regularizar.</p><Button asChild><Link to="/suporte">Falar com suporte técnico</Link></Button></main>});