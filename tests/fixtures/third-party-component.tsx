/**
 * Simulates a third-party library component (like MUI, Radix UI, etc.)
 * that imports useId directly from 'react'.
 *
 * On React 17, this import resolves to undefined — unless
 * useid-polyfill/auto has been imported first to patch React.
 */
import { createElement } from 'react';
import { useId } from 'react';

export function ThirdPartyInput({ label }: { label: string }) {
  const id = useId();
  return createElement(
    'div',
    null,
    createElement('label', { htmlFor: id }, label),
    createElement('input', { id }),
  );
}
