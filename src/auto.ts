import * as React from 'react';
import { useId } from './useId';

const ReactObj = React as Record<string, unknown>;

if (typeof ReactObj['useId'] !== 'function') {
  try {
    Object.defineProperty(ReactObj, 'useId', {
      value: useId,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[useid-polyfill/auto] Could not patch React.useId. ' +
          'Your environment may not support runtime patching. ' +
          'Consider using a bundler alias instead. ' +
          'See: https://github.com/dermyhughes/useid-polyfill#option-2-bundler-alias',
      );
    }
  }
}
