# useid-polyfill

A React `useId` polyfill for React 16 and 17, with SSR support.

React 18 introduced `useId()` for generating unique, stable IDs — critical for accessibility (ARIA attributes, label associations). This package detects React 18+ and delegates to the native `useId`. On React 16/17, it provides a fallback that avoids hydration mismatches.

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

### `useId(): string | undefined`

Returns a unique, stable ID string. On React 18+, delegates to the native `React.useId()`.

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

## How It Works

1. **React 18+ detection**: If `React.useId` exists, it is used directly
2. **Fallback (React 16/17)**:
   - Server: `useState` initializes with `undefined` (no ID in HTML)
   - Hydration: also `undefined` (matches server output — no mismatch)
   - `useLayoutEffect` fires before paint, sets the ID via `genId()`
   - `useEffect` marks handoff complete so subsequent mounts get IDs immediately

## License

MIT
