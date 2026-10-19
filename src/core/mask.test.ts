import { describe, expect, it } from 'vitest';
import { caretAfterDigits, formatGroups } from './mask';

describe('formatGroups', () => {
  it('inserts separators only between filled groups', () => {
    expect(formatGroups('', [2, 2, 4], '/')).toBe('');
    expect(formatGroups('17', [2, 2, 4], '/')).toBe('17');
    expect(formatGroups('171', [2, 2, 4], '/')).toBe('17/1');
    expect(formatGroups('17102569', [2, 2, 4], '/')).toBe('17/10/2569');
    expect(formatGroups('1101700203451', [1, 4, 5, 2, 1], '-')).toBe('1-1017-00203-45-1');
  });
});

describe('caretAfterDigits', () => {
  it('skips separators', () => {
    expect(caretAfterDigits('17/10/2569', 0)).toBe(0);
    expect(caretAfterDigits('17/10/2569', 2)).toBe(2);
    expect(caretAfterDigits('17/10/2569', 3)).toBe(4);
    expect(caretAfterDigits('๑๗/๑๐', 3)).toBe(4);
    expect(caretAfterDigits('17', 5)).toBe(2);
  });
});
