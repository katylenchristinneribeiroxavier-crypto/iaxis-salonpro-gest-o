import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/_authenticated/gestao-revendedores')({beforeLoad:()=>{throw redirect({to:'/indique-e-ganhe'});}});
