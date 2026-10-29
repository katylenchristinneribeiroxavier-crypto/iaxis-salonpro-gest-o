import { describe,it,expect } from 'vitest';
import { salesSummary,normalizeQualification } from './reseller-ai';
describe('Resumo do revendedor',()=>{
 it('comissão de 20% por venda e separação dos valores pagos e pendentes',()=>{expect(salesSummary([{commission:59.9*0.2,status:'pago'},{commission:99.9*0.2,status:'pendente_a_pagar'}])).toEqual({count:2,generated:31.96,paid:11.98,pending:19.98});});
 it('não contabiliza vendas canceladas como validadas',()=>{expect(salesSummary([{commission:29.98,status:'cancelado'}])).toEqual({count:0,generated:0,paid:0,pending:0});});
 it('mantém resumo curto e destaque para ligação retornados pela IA',()=>{expect(normalizeQualification({score:90,summary:'Salão compatível com o perfil informado.',callRecommended:true,callReason:'Interesse em demonstração.'})).toEqual({score:90,summary:'Salão compatível com o perfil informado.',call_recommended:true,call_reason:'Interesse em demonstração.'});});
});