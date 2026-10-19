import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  BE_OFFSET,
  clampDay,
  createDate,
  daysInMonth,
  dayKey,
  fromISODate,
  isLeapYear,
  isSameDay,
  isSameMonth,
  monthDiff,
  startOfMonth,
  toBEYear,
  toCEYear,
  toISODate,
} from './date';

describe('BE/CE conversion', () => {
  it('uses the 543-year offset', () => {
    expect(BE_OFFSET).toBe(543);
    expect(toBEYear(2026)).toBe(2569);
    expect(toCEYear(2569)).toBe(2026);
    expect(toCEYear(toBEYear(1))).toBe(1);
  });
});

describe('createDate', () => {
  it('creates local midnight', () => {
    const d = createDate(2026, 9, 17);
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([
      2026, 9, 17, 0, 0,
    ]);
  });

  it('keeps years below 100 literal', () => {
    expect(createDate(43, 0, 1).getFullYear()).toBe(43);
  });

  it('rolls over like Date', () => {
    expect(toISODate(createDate(2026, 0, 32))).toBe('2026-02-01');
  });
});

describe('leap years', () => {
  it.each([
    [2024, true],
    [2026, false],
    [2000, true],
    [1900, false],
    [2100, false],
  ])('%i → %s', (year, leap) => {
    expect(isLeapYear(year)).toBe(leap);
    expect(daysInMonth(year, 1)).toBe(leap ? 29 : 28);
  });
});

describe('arithmetic', () => {
  it('adds days across months and years', () => {
    expect(toISODate(addDays(createDate(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(toISODate(addDays(createDate(2024, 2, 1), -1))).toBe('2024-02-29');
  });

  it('clamps the day when adding months', () => {
    expect(toISODate(addMonths(createDate(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(toISODate(addMonths(createDate(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(toISODate(addMonths(createDate(2024, 1, 29), 12))).toBe('2025-02-28');
    expect(toISODate(addMonths(createDate(2026, 4, 15), -17))).toBe('2024-12-15');
  });

  it('compares calendar days only', () => {
    const morning = new Date(2026, 9, 17, 1, 0);
    const night = new Date(2026, 9, 17, 23, 59);
    expect(isSameDay(morning, night)).toBe(true);
    expect(isSameDay(morning, null)).toBe(false);
    expect(isSameDay(null, null)).toBe(true);
    expect(dayKey(morning)).toBe(dayKey(night));
    expect(isSameMonth(morning, createDate(2026, 9, 1))).toBe(true);
    expect(monthDiff(createDate(2025, 10, 30), createDate(2026, 1, 1))).toBe(3);
    expect(toISODate(startOfMonth(night))).toBe('2026-10-01');
  });

  it('clamps to min/max', () => {
    const min = createDate(2026, 0, 10);
    const max = createDate(2026, 0, 20);
    expect(toISODate(clampDay(createDate(2026, 0, 1), min, max))).toBe('2026-01-10');
    expect(toISODate(clampDay(createDate(2026, 0, 31), min, max))).toBe('2026-01-20');
    expect(toISODate(clampDay(createDate(2026, 0, 15), min, max))).toBe('2026-01-15');
  });
});

describe('ISO date (timezone safe)', () => {
  it('formats from local parts, never through UTC', () => {
    // 00:30 local is still the previous day in UTC for any zone east of UTC.
    expect(toISODate(new Date(2026, 9, 17, 0, 30))).toBe('2026-10-17');
    // 23:30 local is already the next day in UTC for any zone west of UTC.
    expect(toISODate(new Date(2026, 9, 17, 23, 30))).toBe('2026-10-17');
    expect(toISODate(createDate(43, 0, 5))).toBe('0043-01-05');
  });

  it('parses as local midnight', () => {
    const d = fromISODate('2024-02-29')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2024, 1, 29, 0]);
  });

  it('rejects impossible or malformed dates', () => {
    expect(fromISODate('2026-02-29')).toBeNull();
    expect(fromISODate('2026-13-01')).toBeNull();
    expect(fromISODate('2026-04-31')).toBeNull();
    expect(fromISODate('17/10/2026')).toBeNull();
  });

  it('round-trips every day of a leap year', () => {
    for (let i = 0; i < 366; i++) {
      const d = addDays(createDate(2024, 0, 1), i);
      expect(isSameDay(fromISODate(toISODate(d)), d)).toBe(true);
    }
  });
});
