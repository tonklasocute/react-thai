import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDate, toISODate } from '../core/date';
import { type DateRange, useThaiCalendar } from './useThaiCalendar';

const today = createDate(2026, 9, 17);

describe('useThaiCalendar', () => {
  it('builds a Sunday-first month grid with padding cells', () => {
    const { result } = renderHook(() => useThaiCalendar({ today }));
    const [month] = result.current.months;
    expect(month!.label).toBe('ตุลาคม 2569');
    // 1 Oct 2026 is a Thursday → 4 padding cells.
    expect(month!.weeks[0]!.slice(0, 4)).toEqual([null, null, null, null]);
    expect(month!.weeks[0]![4]!.label).toBe('1');
    expect(month!.weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(month!.weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('lists BE years (descending) and Thai month names', () => {
    const { result } = renderHook(() =>
      useThaiCalendar({ today, minDate: createDate(2020, 5, 1), maxDate: createDate(2027, 2, 1) }),
    );
    expect(result.current.yearOptions.map((o) => o.label)).toEqual([
      '2570',
      '2569',
      '2568',
      '2567',
      '2566',
      '2565',
      '2564',
      '2563',
    ]);
    expect(result.current.monthOptions[0]).toEqual({ value: 0, label: 'มกราคม', disabled: false });
  });

  it('renders Thai digits and English labels', () => {
    const { result } = renderHook(() => useThaiCalendar({ today, digits: 'thai' }));
    expect(result.current.months[0]!.label).toBe('ตุลาคม ๒๕๖๙');
    const en = renderHook(() => useThaiCalendar({ today, locale: 'en', era: 'CE' }));
    expect(en.result.current.months[0]!.label).toBe('October 2026');
    expect(en.result.current.weekdays[0]).toEqual({ short: 'Su', long: 'Sunday' });
  });

  it('shows several months and keeps focus visible', () => {
    const { result } = renderHook(() => useThaiCalendar({ today, numberOfMonths: 2 }));
    expect(result.current.months.map((m) => m.label)).toEqual(['ตุลาคม 2569', 'พฤศจิกายน 2569']);
    act(() => result.current.focusDate(createDate(2026, 11, 5)));
    expect(result.current.months.map((m) => m.label)).toEqual(['พฤศจิกายน 2569', 'ธันวาคม 2569']);
    act(() => result.current.focusDate(createDate(2026, 8, 1)));
    expect(result.current.months[0]!.label).toBe('กันยายน 2569');
  });

  it('navigates months and clamps the day', () => {
    const { result } = renderHook(() =>
      useThaiCalendar({ today, defaultMonth: createDate(2024, 0, 31) }),
    );
    act(() => result.current.nextMonth());
    expect(toISODate(result.current.focusedDate)).toBe('2024-02-29');
    act(() => result.current.prevMonth());
    expect(toISODate(result.current.focusedDate)).toBe('2024-01-29');
  });

  it('selects ranges in order', () => {
    const onRangeSelect = vi.fn();
    const { result, rerender } = renderHook(
      (range: DateRange) => useThaiCalendar({ today, mode: 'range', range, onRangeSelect }),
      { initialProps: { from: null, to: null } as DateRange },
    );
    act(() => result.current.selectDate(createDate(2026, 9, 10)));
    expect(onRangeSelect).toHaveBeenLastCalledWith({ from: createDate(2026, 9, 10), to: null });
    rerender({ from: createDate(2026, 9, 10), to: null });
    act(() => result.current.selectDate(createDate(2026, 9, 12)));
    expect(onRangeSelect).toHaveBeenLastCalledWith({
      from: createDate(2026, 9, 10),
      to: createDate(2026, 9, 12),
    });
    rerender({ from: createDate(2026, 9, 10), to: createDate(2026, 9, 12) });
    const days = result.current.months[0]!.weeks.flat().filter((d) => d !== null);
    expect(days.filter((d) => d.isInRange).map((d) => d.label)).toEqual(['10', '11', '12']);
    expect(days.find((d) => d.isRangeStart)!.label).toBe('10');
    expect(days.find((d) => d.isRangeEnd)!.label).toBe('12');
    // A third click starts a new range.
    act(() => result.current.selectDate(createDate(2026, 9, 20)));
    expect(onRangeSelect).toHaveBeenLastCalledWith({ from: createDate(2026, 9, 20), to: null });
  });

  it('does not select disabled days', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useThaiCalendar({ today, onSelect, isDateDisabled: (d) => d.getDate() === 13 }),
    );
    act(() => result.current.selectDate(createDate(2026, 9, 13)));
    expect(onSelect).not.toHaveBeenCalled();
    expect(result.current.isDisabled(createDate(2026, 9, 13))).toBe(true);
  });
});
