import {createFileRoute} from '@tanstack/react-router';
import {SupportForm} from '@/components/Support';
import {Brand} from '@/components/Shell';
import {pageHead} from '@/lib/salon-data';
export const Route=createFileRoute('/suporte')({head:()=>pageHead('Suporte técnico','Fale com o suporte técnico da plataforma IAxis SalonPRO.'),component:()=> <div className="min-h-screen bg-gradient-navy p-6"><div className="mx-auto max-w-4xl"><Brand/><div className="mt-10"><SupportForm/></div></div></div>});