import { render } from '@testing-library/react';
import { createElement } from 'react';

export function renderHook<T>(hook: () => T) {
  const result = { current: undefined as unknown as T };
  function TestComponent() {
    result.current = hook();
    return null;
  }
  const { rerender: rerenderComponent } = render(createElement(TestComponent));
  return {
    result,
    rerender: () => rerenderComponent(createElement(TestComponent)),
  };
}
