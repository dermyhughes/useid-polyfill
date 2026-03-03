import * as ReactNamespace from 'react';
import { useId } from './useId';

function tryPatch(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false;
  const obj = target as Record<string, unknown>;
  if (typeof obj['useId'] === 'function') return true;

  try {
    Object.defineProperty(obj, 'useId', {
      value: useId,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return typeof obj['useId'] === 'function';
  } catch {
    return false;
  }
}

// In ESM, the namespace object is read-only per spec, but its .default property
// (from CJS interop) points to the mutable module.exports object.
// Patch both targets: .default covers real ESM environments (where namespace is
// immutable but .default is the mutable CJS module.exports), and the namespace
// covers CJS environments (where it IS the mutable exports object).
const ReactCjs = (ReactNamespace as Record<string, unknown>).default;

const patchedCjs = tryPatch(ReactCjs);
const patchedNs = tryPatch(ReactNamespace);
const patched = patchedCjs || patchedNs;

if (!patched && typeof console !== 'undefined' && console.warn) {
  console.warn(
    '[useid-polyfill/auto] Could not patch React.useId. ' +
      'Your environment may not support runtime patching. ' +
      'Consider using a bundler alias instead. ' +
      'See: https://github.com/dermyhughes/useid-polyfill#option-2-bundler-alias',
  );
}
