import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Splash } from './Splash';

afterEach(() => { cleanup(); vi.useRealTimers(); sessionStorage.clear(); });
describe('Abertura do aplicativo', () => {
  it('libera o aplicativo após dois segundos e não reaparece na mesma sessão', () => {
    vi.useFakeTimers();
    sessionStorage.clear();
    const first = render(<Splash />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('splash-seen')).toBe('1');
    first.unmount();
    render(<Splash />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});