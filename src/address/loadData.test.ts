import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('./data/th');
  vi.resetModules();
});

describe('loadThaiAddressIndex', () => {
  it('caches the index between calls', async () => {
    const { loadThaiAddressIndex } = await import('./loadData');
    const a = await loadThaiAddressIndex();
    expect(await loadThaiAddressIndex()).toBe(a);
    const en = await loadThaiAddressIndex(true);
    expect(en).not.toBe(a);
    expect(await loadThaiAddressIndex(true)).toBe(en);
  });

  it('reports load errors and allows a retry', async () => {
    let fail = true;
    vi.doMock('./data/th', async (importOriginal) => {
      if (fail) throw new Error('offline');
      return importOriginal();
    });
    const { loadThaiAddressIndex } = await import('./loadData');
    const { renderHook, waitFor, act } = await import('@testing-library/react');
    const { useThaiAddress } = await import('./useThaiAddress');
    const { result } = renderHook(() => useThaiAddress());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBeInstanceOf(Error);
    await expect(loadThaiAddressIndex(true)).rejects.toThrow();
    fail = false;
    vi.resetModules();
    const fresh = await import('./loadData');
    await act(async () => {
      await fresh.loadThaiAddressIndex();
    });
    expect((await fresh.loadThaiAddressIndex()).records.length).toBeGreaterThan(7000);
  });
});
