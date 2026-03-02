# Testing

## Unit tests (vitest)

Run the existing test suite against the installed React version:

```bash
npm test
```

### Multi-version testing

The hook behaves differently across React versions (native `useId` in React 18+, polyfill in 16/17). Use these scripts to verify all supported versions:

```bash
npm run test:react16   # React 16 + @testing-library/react@12
npm run test:react17   # React 17 + @testing-library/react@12
npm run test:react18   # React 18 + @testing-library/react@16
npm run test:react19   # React 19 + @testing-library/react@16
npm run test:all       # All four versions in sequence
```

> **Note:** Each script temporarily overrides the installed React version. Run `npm install` afterwards to restore React 18.

## E2E tests (Playwright)

Playwright tests the demo app in a real Chromium browser, verifying:
- All 6 components render with unique IDs in the expected format for the demo's React version (native `:rN:` format with React 18+)
- No `console.error` calls (catches hydration mismatch warnings)
- IDs are stable within a page session

### Setup (first time only)

```bash
npm install
npx playwright install chromium
```

The demo app also needs to be built and have its own dependencies installed:

```bash
npm run build
cd demo && npm install && cd ..
```

### Running

```bash
npm run test:e2e
```

Playwright automatically starts the demo's Vite dev server on `localhost:5173` before running tests.

### Cross-version coverage

Multi-version behavior is verified by the **unit tests** (`npm run test:all`), which mock
`React.useId` to test both the native delegation and fallback paths across React 16, 17, 18, and 19.

The **e2e tests** verify real browser behavior using the demo app, which runs React 18.
The assertions are strict: they expect the native `useId` format (`:rN:`), confirming
that the polyfill correctly delegates to `React.useId` when available.

Together, the two test layers provide complete coverage:
- Unit tests: all 4 React versions, both code paths, including SSR
- E2e tests: real browser rendering with React 18, verifying native delegation works end-to-end
