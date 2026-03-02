import * as React from 'react';
import { useState, useEffect, useLayoutEffect } from 'react';

const _React = { ...React } as typeof React & { useId?: () => string };

let count = 0;
const prefix = Math.random().toString(36).slice(2, 6);
export const genId = (): string => `uid-${prefix}${count++}`;

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

let serverHandoffComplete = false;

function useFallbackId(): string | undefined {
  const [id, setId] = useState<string | undefined>(() =>
    serverHandoffComplete ? genId() : undefined
  );

  useIsomorphicLayoutEffect(() => {
    if (id === undefined) {
      setId(genId());
    }
  }, []);

  useEffect(() => {
    if (!serverHandoffComplete) {
      serverHandoffComplete = true;
    }
  }, []);

  return id;
}

export const useId: () => string | undefined = _React.useId || useFallbackId;
