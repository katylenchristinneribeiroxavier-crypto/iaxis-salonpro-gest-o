import {it,expect} from 'vitest';
import {accessOpen} from './salon-access';
it('bloqueia o salão quando o acesso é cortado',()=>expect(accessOpen({access_enabled:false,suspended_until:null,archived_at:null})).toBe(false));
it('libera suspensão somente após o prazo',()=>{const s={access_enabled:false,suspended_until:'2026-11-05T12:00:00Z',archived_at:null};expect(accessOpen(s,Date.parse('2026-11-05T11:59:00Z'))).toBe(false);expect(accessOpen(s,Date.parse('2026-11-05T12:00:00Z'))).toBe(true);});
it('arquivado permanece inacessível',()=>expect(accessOpen({access_enabled:true,suspended_until:null,archived_at:'2026-10-29'})).toBe(false));