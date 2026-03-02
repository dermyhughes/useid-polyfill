import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ActualReact from 'react';
import { renderToString } from 'react-dom/server';

function mockReact(useId?: () => string) {
  vi.resetModules();
  vi.doMock('react', async () => {
    const real = await vi.importActual<typeof ActualReact>('react');
    return { ...real, useId };
  });
}

describe('useId SSR', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders undefined on server (no ID in HTML)', async () => {
    mockReact(undefined);
    const mod = await import('../src/useId');
    const React = await import('react');

    function TestComponent() {
      const id = mod.useId();
      return React.createElement('div', { id: id || '' }, id ?? 'no-id');
    }

    const html = renderToString(React.createElement(TestComponent));
    expect(html).toContain('no-id');
  });

  it('provides an ID after hydration', async () => {
    mockReact(undefined);
    const mod = await import('../src/useId');
    const { renderHook } = await import('@testing-library/react');

    const { result } = renderHook(() => mod.useId());
    expect(typeof result.current).toBe('string');
    expect(result.current).toMatch(/^uid-/);
  });
});
