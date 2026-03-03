import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ActualReact from 'react';
import { renderHook } from './helpers/renderHook';

function mockReactWithoutUseId() {
  vi.doMock('react', async () => {
    const real = await vi.importActual<typeof ActualReact>('react');
    const { useId: _useId, ...rest } = real as typeof ActualReact & {
      useId?: () => string;
    };
    return { ...rest, useId: undefined };
  });
}

describe('useid-polyfill/auto', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('patches React.useId when it does not exist', async () => {
    mockReactWithoutUseId();
    await import('../src/auto');
    const React = (await import('react')) as typeof ActualReact & {
      useId?: () => string;
    };
    expect(typeof React.useId).toBe('function');
  });

  it('does not override native React.useId', async () => {
    const nativeUseId = vi.fn(() => ':r1:');
    vi.doMock('react', async () => {
      const real = await vi.importActual<typeof ActualReact>('react');
      return { ...real, useId: nativeUseId };
    });
    await import('../src/auto');
    const React = (await import('react')) as typeof ActualReact & {
      useId?: () => string;
    };
    expect(React.useId).toBe(nativeUseId);
  });

  it('patched useId works as a hook', async () => {
    mockReactWithoutUseId();
    await import('../src/auto');
    const React = (await import('react')) as typeof ActualReact & {
      useId?: () => string;
    };
    expect(React.useId).toBeDefined();
    const { result } = renderHook(() => React.useId!());
    expect(typeof result.current).toBe('string');
  });
});
