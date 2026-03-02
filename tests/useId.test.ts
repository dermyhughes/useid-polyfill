import { describe, it, expect, vi } from 'vitest';
import * as ActualReact from 'react';
import { renderHook } from '@testing-library/react';

function mockReact(useId?: () => string) {
  vi.resetModules();
  vi.doMock('react', async () => {
    const real = await vi.importActual<typeof ActualReact>('react');
    return { ...real, useId };
  });
}

describe('useId (fallback)', () => {
  it('returns a string after render', async () => {
    mockReact(undefined);
    const mod = await import('../src/useId');
    const { result } = renderHook(() => mod.useId());
    expect(typeof result.current).toBe('string');
  });

  it('returns a stable ID across re-renders', async () => {
    mockReact(undefined);
    const mod = await import('../src/useId');
    const { result, rerender } = renderHook(() => mod.useId());
    const firstId = result.current;
    rerender();
    rerender();
    expect(result.current).toBe(firstId);
  });

  it('returns unique IDs for sibling components', async () => {
    mockReact(undefined);
    const mod = await import('../src/useId');
    const { result: r1 } = renderHook(() => mod.useId());
    const { result: r2 } = renderHook(() => mod.useId());
    expect(r1.current).not.toBe(r2.current);
  });

  it('returns different IDs for multiple calls in one component', async () => {
    mockReact(undefined);
    const mod = await import('../src/useId');
    const { result } = renderHook(() => [mod.useId(), mod.useId()]);
    const [id1, id2] = result.current;
    expect(id1).not.toBe(id2);
  });
});

describe('useId (native delegation)', () => {
  it('delegates to React.useId when available', async () => {
    const nativeUseId = vi.fn(() => ':r1:');
    mockReact(nativeUseId);
    const mod = await import('../src/useId');
    const { result } = renderHook(() => mod.useId());
    expect(nativeUseId).toHaveBeenCalled();
    expect(result.current).toBe(':r1:');
  });
});
