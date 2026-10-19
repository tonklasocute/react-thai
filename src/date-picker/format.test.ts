import { describe, expect, it } from 'vitest';
import { createDate, toISODate } from '../core/date';
import { formatDate, maskDate, parseDate } from './format';
import { formatLongDate, formatYear } from './locale';

const iso = (text: string, era: 'BE' | 'CE' = 'BE') => {
  const { date } = parseDate(text, { era });
  return date && toISODate(date);
};

describe('formatDate', () => {
  const date = createDate(2026, 9, 7);
  it('formats in BE by default', () => expect(formatDate(date)).toBe('07/10/2569'));
  it('formats in CE', () => expect(formatDate(date, { era: 'CE' })).toBe('07/10/2026'));
  it('formats with Thai digits', () =>
    expect(formatDate(date, { digits: 'thai' })).toBe('๐๗/๑๐/๒๕๖๙'));
  it('masks partial input', () => {
    expect(maskDate('1710')).toBe('17/10');
    expect(maskDate('1710', 'thai')).toBe('๑๗/๑๐');
  });
});

describe('parseDate', () => {
  it('reads BE years and returns a CE Date', () => {
    expect(iso('17/10/2569')).toBe('2026-10-17');
    expect(iso('1/1/2500')).toBe('1957-01-01');
  });

  it('reads CE years when era is CE', () => {
    expect(iso('17/10/2026', 'CE')).toBe('2026-10-17');
  });

  it('accepts Thai digits and other separators', () => {
    expect(iso('๑๗/๑๐/๒๕๖๙')).toBe('2026-10-17');
    expect(iso('17-10-2569')).toBe('2026-10-17');
    expect(iso(' 17.10.2569 ')).toBe('2026-10-17');
  });

  describe('29 February in BE', () => {
    it('accepts BE leap years (2567 = 2024)', () => expect(iso('29/02/2567')).toBe('2024-02-29'));
    it('rejects BE non-leap years (2569 = 2026)', () => expect(iso('29/02/2569')).toBeNull());
    it('accepts 2543 (= 2000, divisible by 400)', () =>
      expect(iso('29/02/2543')).toBe('2000-02-29'));
    it('rejects 2443 (= 1900, century)', () => expect(iso('29/02/2443')).toBeNull());
    it('does not apply BE leap rule to the BE number itself', () => {
      // 2568 BE is divisible by 4 but 2025 CE is not a leap year.
      expect(iso('29/02/2568')).toBeNull();
    });
  });

  it('rejects impossible dates instead of rolling over', () => {
    expect(parseDate('31/04/2569')).toEqual({ date: null, error: 'invalid' });
    expect(parseDate('00/01/2569').error).toBe('invalid');
    expect(parseDate('01/13/2569').error).toBe('invalid');
    expect(parseDate('01/01/0543').error).toBe('invalid');
  });

  it('reports incomplete input', () => {
    expect(parseDate('17/10/25')).toEqual({ date: null, error: 'incomplete' });
    expect(parseDate('').error).toBe('incomplete');
    expect(parseDate('17/10/25690').error).toBe('invalid');
  });
});

describe('long date (screen reader text)', () => {
  const date = createDate(2026, 9, 17);
  it('th / BE', () => expect(formatLongDate(date)).toBe('วันเสาร์ที่ 17 ตุลาคม พ.ศ. 2569'));
  it('th / CE', () =>
    expect(formatLongDate(date, 'th', 'CE')).toBe('วันเสาร์ที่ 17 ตุลาคม ค.ศ. 2026'));
  it('en / BE', () => expect(formatLongDate(date, 'en')).toBe('Saturday, 17 October 2569 BE'));
  it('en / CE', () => expect(formatLongDate(date, 'en', 'CE')).toBe('Saturday, 17 October 2026'));
  it('thai digits', () =>
    expect(formatLongDate(date, 'th', 'BE', 'thai')).toBe('วันเสาร์ที่ ๑๗ ตุลาคม พ.ศ. ๒๕๖๙'));
  it('year only', () => expect(formatYear(2026, 'BE')).toBe('2569'));
});
