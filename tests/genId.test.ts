import { describe, it, expect } from 'vitest';
import { genId } from '../src/useId';

describe('genId', () => {
  it('produces unique IDs across 1000 calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => genId()));
    expect(ids.size).toBe(1000);
  });

  it('returns IDs matching the expected format', () => {
    const id = genId();
    expect(id).toMatch(/^uid-[a-z0-9]{4}\d+$/);
  });
});
