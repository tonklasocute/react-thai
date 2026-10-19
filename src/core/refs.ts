import { type Ref, type RefCallback, useEffect, useLayoutEffect } from 'react';

/** Combine refs (forwarded + internal) into one callback ref. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

/** useLayoutEffect on the client, useEffect on the server (no SSR warning). */
export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
