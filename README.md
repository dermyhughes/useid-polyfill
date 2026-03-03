# useid-polyfill

A React `useId` polyfill for React 16 and 17, with SSR support.

React 18 introduced `useId()` for generating unique, stable IDs — critical for accessibility (ARIA attributes, label associations). This package detects React 18+ and delegates to the native `useId`. On React 16/17, it provides a fallback that avoids hydration mismatches.

Need to support a third-party library that uses `useId` on React 16/17? See [Polyfilling Third-Party Libraries](#polyfilling-third-party-libraries).

## Installation

```bash
npm install useid-polyfill
```

## Usage

```tsx
import { useId } from 'useid-polyfill';

function FormField({ label }: { label: string }) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </div>
  );
}
```

## API

### `useId()`

Returns a unique, stable ID string. On React 18+, delegates to the native `React.useId()`.

TypeScript return type is conditional on your installed React typings:

- React 18+ typings: `string`
- React 16/17 typings: `string | undefined`

On React 16/17 during SSR, returns `undefined` on the initial server render and hydration pass, then resolves to a string ID after a layout effect. This avoids hydration mismatches.

## SSR Caveats

On React 16/17, the fallback returns `undefined` during server rendering and the hydration pass. The ID is set synchronously before paint via `useLayoutEffect`. This means:

- Elements will briefly have no ID during hydration
- After the first client-side effect cycle, IDs are assigned immediately (no `undefined` phase)
- On React 18+, the native `useId` is used and there are no caveats

If you conditionally apply the ID to DOM attributes, handle the `undefined` case:

```tsx
const id = useId();
return <input id={id ?? undefined} aria-describedby={id ? `${id}-help` : undefined} />;
```

## Polyfilling Third-Party Libraries

If you use React 16 or 17 and install a third-party library (e.g., MUI, Radix UI) that internally calls `React.useId`, it will crash because `React.useId` does not exist before React 18.

### Option 1: Auto-patching (recommended)

Import `useid-polyfill/auto` **once** at the very top of your app entry point, **before any other imports**:

```js
// src/index.js — must be the first import
import 'useid-polyfill/auto';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
```

This patches `React.useId` globally so any library importing `useId` from `react` will get the polyfill. On React 18+, this is a no-op.

> **SSR note:** On React 16/17, the patched `useId` returns `undefined` during server rendering and hydration (same as the direct polyfill — see [SSR Caveats](#ssr-caveats)). Most libraries handle this gracefully, but if a third-party component breaks during hydration, this is likely why.

### Option 2: Bundler alias

If runtime patching does not work in your environment, you can configure your bundler to shim React.

Create a file `react-shim.js` at your project root:

```js
const React = require('react');
if (!React.useId) {
  const { useId } = require('useid-polyfill');
  React.useId = useId;
}
module.exports = React;
```

**Webpack** — in `webpack.config.js`:

```js
module.exports = {
  resolve: {
    alias: {
      react: require.resolve('./react-shim.js'),
    },
  },
};
```

**Vite** — in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, './react-shim.js'),
    },
  },
});
```

### Option 3: patch-package

As a last resort, you can use [patch-package](https://www.npmjs.com/package/patch-package) to modify the offending library's source to import from `useid-polyfill` instead of `react`.

## How It Works

1. **React 18+ detection**: If `React.useId` exists, it is used directly
2. **Fallback (React 16/17)**:
   - Server: `useState` initializes with `undefined` (no ID in HTML)
   - Hydration: also `undefined` (matches server output — no mismatch)
   - `useLayoutEffect` fires before paint, sets the ID via `genId()`
   - `useEffect` marks handoff complete so subsequent mounts get IDs immediately

## License

MIT
