import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ActualReact from 'react';

const hasNativeUseId = typeof (ActualReact as any).useId === 'function';

function mockReactWithoutUseId() {
  vi.doMock('react', async () => {
    const real = await vi.importActual<typeof ActualReact>('react');
    const { useId: _useId, ...rest } = real as typeof ActualReact & {
      useId?: () => string;
    };
    return { ...rest, useId: undefined };
  });
}

describe('auto polyfill with third-party component', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('third-party component renders with valid linked IDs', async () => {
    if (hasNativeUseId) {
      mockReactWithoutUseId();
    }

    // Import auto FIRST — this patches React.useId
    await import('../src/auto');

    // Then import the third-party component (which imports useId from 'react')
    const { ThirdPartyInput } = await import(
      './fixtures/third-party-component'
    );
    const { render } = await import('@testing-library/react');
    const { createElement } = await import('react');

    const { container } = render(createElement(ThirdPartyInput, { label: 'Email' }));

    const label = container.querySelector('label');
    const input = container.querySelector('input');

    expect(label).not.toBeNull();
    expect(input).not.toBeNull();

    const labelFor = label!.getAttribute('for');
    const inputId = input!.getAttribute('id');

    // Both should have the same non-empty ID in polyfill format
    expect(labelFor).toBeTruthy();
    expect(inputId).toBeTruthy();
    expect(labelFor).toBe(inputId);
    expect(inputId).toMatch(/^uid-[a-z0-9]{4}\d+$/);
  });

  it('multiple third-party components get unique IDs', async () => {
    if (hasNativeUseId) {
      mockReactWithoutUseId();
    }

    await import('../src/auto');

    const { ThirdPartyInput } = await import(
      './fixtures/third-party-component'
    );
    const { render } = await import('@testing-library/react');
    const { createElement } = await import('react');

    const { container: c1 } = render(
      createElement(ThirdPartyInput, { label: 'First' }),
    );
    const { container: c2 } = render(
      createElement(ThirdPartyInput, { label: 'Second' }),
    );

    const id1 = c1.querySelector('input')!.getAttribute('id');
    const id2 = c2.querySelector('input')!.getAttribute('id');

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('third-party component IDs are stable across re-renders', async () => {
    if (hasNativeUseId) {
      mockReactWithoutUseId();
    }

    await import('../src/auto');

    const { ThirdPartyInput } = await import(
      './fixtures/third-party-component'
    );
    const { render } = await import('@testing-library/react');
    const { createElement } = await import('react');

    const { container, rerender } = render(
      createElement(ThirdPartyInput, { label: 'Email' }),
    );

    const idBefore = container.querySelector('input')!.getAttribute('id');
    expect(idBefore).toBeTruthy();

    // Re-render the same component
    rerender(createElement(ThirdPartyInput, { label: 'Email' }));

    const idAfter = container.querySelector('input')!.getAttribute('id');
    expect(idAfter).toBe(idBefore);
  });

  it('without auto-patch, third-party component crashes on React 17', async () => {
    if (hasNativeUseId) {
      mockReactWithoutUseId();
    }

    // Do NOT import auto — render the component and expect it to throw
    const { ThirdPartyInput } = await import(
      './fixtures/third-party-component'
    );
    const { render } = await import('@testing-library/react');
    const { createElement } = await import('react');

    expect(() => {
      render(createElement(ThirdPartyInput, { label: 'Email' }));
    }).toThrow();
  });
});
