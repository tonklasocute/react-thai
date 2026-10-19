import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useThaiAddress } from './useThaiAddress';

describe('useThaiAddress', () => {
  it('preloads and searches', async () => {
    const { result } = renderHook(() => useThaiAddress({ limit: 3 }));
    expect(result.current.search('สุเทพ')).toEqual([]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.ready).toBe(true);
    expect(result.current.search('เมือง')).toHaveLength(3);
    expect(result.current.search('เมือง', { limit: 5 })).toHaveLength(5);
    expect(result.current.lookupPostcode('50200').map((a) => a.subdistrict)).toContain('สุเทพ');
  });

  it('waits for load() when preload is false', async () => {
    const { result } = renderHook(() => useThaiAddress({ preload: false }));
    expect(result.current.status).toBe('idle');
    expect(result.current.lookupPostcode('10200')).toEqual([]);
    let loaded: unknown;
    await act(async () => {
      loaded = await result.current.load();
    });
    expect(loaded).not.toBeNull();
    expect(result.current.status).toBe('ready');
  });

  it('loads English names on request', async () => {
    const { result } = renderHook(() => useThaiAddress({ includeEnglish: true }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.index?.hasEnglish).toBe(true);
    expect(result.current.search('mueang chiang mai')[0]?.address.en?.district).toBe(
      'Mueang Chiang Mai',
    );
  });
});
