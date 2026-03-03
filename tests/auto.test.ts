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

  it('patched useId works as a hook and returns valid ID format', async () => {
    mockReactWithoutUseId();
    await import('../src/auto');
    const React = (await import('react')) as typeof ActualReact & {
      useId?: () => string;
    };
    expect(React.useId).toBeDefined();
    const { result } = renderHook(() => React.useId!());
    expect(typeof result.current).toBe('string');
    expect(result.current).toMatch(/^uid-[a-z0-9]{4}\d+$/);
  });

  it('importing auto multiple times is safe', async () => {
    mockReactWithoutUseId();
    await import('../src/auto');
    const React = (await import('react')) as typeof ActualReact & {
      useId?: () => string;
    };
    const patchedUseId = React.useId;

    // Import auto again — should not replace the already-patched function
    vi.resetModules();
    // Re-apply same mock but now React.useId exists from the first patch
    vi.doMock('react', () => React);
    await import('../src/auto');

    const ReactAfter = (await import('react')) as typeof ActualReact & {
      useId?: () => string;
    };
    expect(ReactAfter.useId).toBe(patchedUseId);
  });

  it('logs a warning when patching fails', async () => {
    vi.doMock('react', async () => {
      const real = await vi.importActual<typeof ActualReact>('react');
      const { useId: _useId, ...rest } = real as typeof ActualReact & {
        useId?: () => string;
      };
      // Return a frozen object so Object.defineProperty throws
      return Object.freeze({ ...rest, useId: undefined });
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await import('../src/auto');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useid-polyfill/auto]'),
    );
    warnSpy.mockRestore();
  });
});
