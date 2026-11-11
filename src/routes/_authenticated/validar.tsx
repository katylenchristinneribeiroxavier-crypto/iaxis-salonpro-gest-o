import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/_authenticated/validar')({beforeLoad:()=>{throw redirect({to:'/indique-e-ganhe'});}});
