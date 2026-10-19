import { useCallback, useEffect, useRef, useState } from 'react';
import { loadThaiAddressIndex } from './loadData';
import {
  type AddressIndex,
  type AddressSuggestion,
  findByPostcode,
  type SearchOptions,
  searchAddresses,
} from './search';
import type { ThaiAddress } from './types';

export type AddressDataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseThaiAddressOptions {
  /** Also load English names (~31 kB gzip more) and match English queries. */
  includeEnglish?: boolean;
  /** Load the dataset on mount. Set `false` to load on demand with `load()`. Default `true`. */
  preload?: boolean;
  /** Default result limit for `search`. Default `10`. */
  limit?: number;
}

/**
 * Headless Thai address search. Loads the dataset lazily and exposes a synchronous
 * `search()` once `status === 'ready'`.
 */
export function useThaiAddress({
  includeEnglish = false,
  preload = true,
  limit = 10,
}: UseThaiAddressOptions = {}) {
  const [index, setIndex] = useState<AddressIndex | null>(null);
  const [status, setStatus] = useState<AddressDataStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const mounted = useRef(true);

  const load = useCallback((): Promise<AddressIndex | null> => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    return loadThaiAddressIndex(includeEnglish).then(
      (loaded) => {
        if (mounted.current) {
          setIndex(loaded);
          setStatus('ready');
          setError(null);
        }
        return loaded;
      },
      (err: unknown) => {
        if (mounted.current) {
          setStatus('error');
          setError(err);
        }
        return null;
      },
    );
  }, [includeEnglish]);

  useEffect(() => {
    mounted.current = true;
    if (preload) void load();
    return () => {
      mounted.current = false;
    };
  }, [preload, load]);

  const search = useCallback(
    (query: string, options?: SearchOptions): AddressSuggestion[] =>
      index ? searchAddresses(index, query, { limit, ...options }) : [],
    [index, limit],
  );

  const lookupPostcode = useCallback(
    (postcode: string): ThaiAddress[] => (index ? findByPostcode(index, postcode) : []),
    [index],
  );

  return { status, error, ready: status === 'ready', load, search, lookupPostcode, index };
}
