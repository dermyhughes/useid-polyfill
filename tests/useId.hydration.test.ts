import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ActualReact from 'react';

type ReactElementLike = ReturnType<typeof ActualReact.createElement>;

function mockReactWithoutUseId() {
  vi.doMock('react', async () => {
    const real = await vi.importActual<typeof ActualReact>('react');
    const { useId: _useId, ...rest } = real as typeof ActualReact & {
      useId?: () => string;
    };
    return { ...rest, useId: undefined };
  });
}

// Hydrate using the version-appropriate API. A computed specifier keeps the
// bundler from statically resolving `react-dom/client`, which does not exist on
// React 16/17. Returns an unmount cleanup fn.
async function hydrate(
  container: HTMLElement,
  element: ReactElementLike,
): Promise<() => void> {
  const clientEntry = 'react-dom' + '/client';
  try {
    const { hydrateRoot } = (await import(
      /* @vite-ignore */ clientEntry
    )) as { hydrateRoot: (c: Element, e: ReactElementLike) => { unmount(): void } };
    const { act } = (await import('react')) as unknown as {
      act: (cb: () => void | Promise<void>) => Promise<void>;
    };
    // React 18+ concurrent hydration: mark this as an act environment so the
    // layout-effect state update flushes without an "not wrapped in act" warning.
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    let root: { unmount(): void } | undefined;
    await act(async () => {
      root = hydrateRoot(container, element);
    });
    return () => root?.unmount();
  } catch {
    // React 16/17: legacy hydrate; layout effects run synchronously in commit.
    const ReactDOM = (await import('react-dom')) as unknown as {
      hydrate: (e: ReactElementLike, c: Element) => void;
      unmountComponentAtNode: (c: Element) => void;
    };
    ReactDOM.hydrate(element, container);
    return () => ReactDOM.unmountComponentAtNode(container);
  }
}

describe('useId SSR → hydration (fallback path)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('server emits no id, client hydrates to a stable linked id, no mismatch', async () => {
    mockReactWithoutUseId();

    const mod = await import('../src/useId');
    const React = await import('react');
    const { renderToString } = await import('react-dom/server');

    function App() {
      const id = mod.useId();
      return React.createElement(
        'div',
        null,
        React.createElement('label', { htmlFor: id ?? undefined }, 'Email'),
        React.createElement('input', { id: id ?? undefined }),
        React.createElement('span', null, id ?? 'no-id'),
      );
    }

    // 1. Server render: the id must NOT appear, so the client's first (hydration)
    //    render can reproduce identical markup and avoid a mismatch.
    const serverHtml = renderToString(React.createElement(App));
    expect(serverHtml).not.toMatch(/uid-/);
    expect(serverHtml).toContain('no-id');

    // 2. Hydrate that markup, capturing any hydration-mismatch warnings.
    const warnings: string[] = [];
    const errSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      const msg = args.join(' ');
      // Fires only in a jsdom test env where `window` is defined during
      // renderToString; never in real Node SSR, and unrelated to hydration.
      if (/useLayoutEffect does nothing on the server/.test(msg)) return;
      warnings.push(msg);
    });

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const cleanup = await hydrate(container, React.createElement(App));

    errSpy.mockRestore();

    // Inspect only the warning message, not the appended component stack — the
    // stack contains this file's path ("…hydration.test.ts"), which would other-
    // wise match the /hydrat/ pattern and produce a false positive.
    const mismatches = warnings.filter((w) => {
      const message = w.split(/\n\s*(?:at |in )/)[0];
      return /did not match|hydrat|server (?:HTML|rendered)/i.test(message);
    });
    expect(mismatches).toEqual([]);

    // 3. The client applied a real, linked id to every element.
    const input = container.querySelector('input');
    const label = container.querySelector('label');
    const id = input?.getAttribute('id');
    expect(id).toMatch(/^uid-[a-z0-9]{4}\d+$/);
    expect(label?.getAttribute('for')).toBe(id);

    cleanup();
    container.remove();
  });
});
