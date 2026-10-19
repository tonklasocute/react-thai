import { describe, expect, it, vi } from 'vitest';
import { runSchemaSuite } from '../../test/zodSuite';

// Run the same suite against zod v3 to back the "^3.23 || ^4" peer range.
vi.mock('zod', async () => import('zod3'));

describe('react-thai/zod (zod v3)', () => {
  it('really runs on zod v3', async () => {
    const { z } = await import('zod');
    expect('toJSONSchema' in z).toBe(false);
  });
  runSchemaSuite();
});
