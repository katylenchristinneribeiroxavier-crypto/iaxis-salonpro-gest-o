import { describe, expect, it } from 'vitest';
import { showsBack } from './navigation';
describe('internal navigation', () => {
  it('omits back on the main dashboard', () => expect(showsBack('/app')).toBe(false));
  it('shows back on internal pages', () => expect(showsBack('/app/configuracoes')).toBe(true));
});