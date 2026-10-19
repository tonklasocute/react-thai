import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addDays,
  addMonths,
  clampDay,
  createDate,
  daysInMonth,
  type Era,
  isAfter,
  isBefore,
  isSameDay,
  monthDiff,
  startOfDay,
  startOfMonth,
} from '../core/date';
import { type Digits, withDigits } from '../core/digits';
import { type CalendarLabels, formatLongDate, formatYear, getLocale, type Locale } from './locale';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface UseThaiCalendarOptions {
  /** `single` (default) or `range`. */
  mode?: 'single' | 'range';
  /** Selected date in `single` mode. */
  selected?: Date | null;
  /** Selected range in `range` mode. */
  range?: DateRange;
  /** Called when a day is chosen in `single` mode. */
  onSelect?: (date: Date) => void;
  /** Called with the next range when a day is chosen in `range` mode. */
  onRangeSelect?: (range: DateRange) => void;
  /** Month shown first. Defaults to the selection, then today. */
  defaultMonth?: Date;
  minDate?: Date | null;
  maxDate?: Date | null;
  /** Return `true` to disable a day (e.g. weekends or holidays). */
  isDateDisabled?: (date: Date) => boolean;
  locale?: Locale;
  era?: Era;
  digits?: Digits;
  /** First column of the grid. Default `0` (Sunday, the Thai convention). */
  weekStartsOn?: WeekDay;
  /** Months rendered side by side. Default `1`. */
  numberOfMonths?: number;
  /** Override "today" (useful for tests and stories). */
  today?: Date;
  /** Override built-in labels. */
  labels?: Partial<CalendarLabels>;
}

export interface CalendarDay {
  date: Date;
  /** Day number with the requested digit style. */
  label: string;
  /** Full spoken date, used as the accessible name. */
  ariaLabel: string;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isFocused: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  /** e.g. "ตุลาคม 2569". */
  label: string;
  /** Rows of 7 cells; `null` is a padding cell outside this month. */
  weeks: Array<Array<CalendarDay | null>>;
}

export interface CalendarOption {
  value: number;
  label: string;
  disabled: boolean;
}

const MIN_YEAR_SPAN = 100;
const MAX_YEAR_SPAN = 20;

/**
 * Headless calendar state and keyboard behaviour following the WAI-ARIA date picker
 * dialog pattern. Render the grid however you like and spread the prop getters.
 */
export function useThaiCalendar(options: UseThaiCalendarOptions = {}) {
  const {
    mode = 'single',
    selected = null,
    range,
    onSelect,
    onRangeSelect,
    minDate,
    maxDate,
    isDateDisabled,
    locale = 'th',
    era = 'BE',
    digits,
    weekStartsOn = 0,
    numberOfMonths = 1,
  } = options;
  const data = getLocale(locale);
  const today = startOfDay(options.today ?? new Date());
  const from = mode === 'range' ? (range?.from ?? null) : selected;
  const to = mode === 'range' ? (range?.to ?? null) : null;

  const [focused, setFocused] = useState(() =>
    startOfDay(clampDay(options.defaultMonth ?? from ?? today, minDate, maxDate)),
  );
  const [view, setView] = useState(() => startOfMonth(focused));
  const [hovered, setHovered] = useState<Date | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const focusRequested = useRef(false);

  const isDisabled = (date: Date): boolean =>
    (!!minDate && isBefore(date, minDate)) ||
    (!!maxDate && isAfter(date, maxDate)) ||
    !!isDateDisabled?.(date);

  /** Move focus, scrolling the visible months so the date stays on screen. */
  const focusDate = (date: Date, moveDomFocus = true) => {
    const next = clampDay(startOfDay(date), minDate, maxDate);
    setFocused(next);
    const offset = monthDiff(view, next);
    if (offset < 0) setView(startOfMonth(next));
    else if (offset >= numberOfMonths) setView(startOfMonth(addMonths(next, 1 - numberOfMonths)));
    focusRequested.current = moveDomFocus;
  };

  const goToMonth = (year: number, month: number) => {
    const day = Math.min(focused.getDate(), daysInMonth(year, month));
    const next = clampDay(createDate(year, month, day), minDate, maxDate);
    setFocused(next);
    setView(startOfMonth(next));
  };

  useEffect(() => {
    if (!focusRequested.current) return;
    focusRequested.current = false;
    gridRef.current?.querySelector<HTMLElement>('[data-focused]')?.focus();
  });

  const selectDate = (date: Date) => {
    if (isDisabled(date)) return;
    focusDate(date, false);
    if (mode === 'single') return onSelect?.(date);
    const restart = !from || !!to || isBefore(date, from);
    onRangeSelect?.(restart ? { from: date, to: null } : { from, to: date });
  };

  const previewEnd = from && !to && hovered && !isBefore(hovered, from) ? hovered : to;

  const months: CalendarMonth[] = Array.from({ length: numberOfMonths }, (_, i) => {
    const first = addMonths(view, i);
    const year = first.getFullYear();
    const month = first.getMonth();
    const lead = (first.getDay() - weekStartsOn + 7) % 7;
    const total = daysInMonth(year, month);
    const cells: Array<CalendarDay | null> = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= total; d++) {
      const date = createDate(year, month, d);
      const isRangeStart = isSameDay(date, from);
      const isRangeEnd = mode === 'range' && isSameDay(date, previewEnd);
      cells.push({
        date,
        label: withDigits(d, digits),
        ariaLabel: formatLongDate(date, locale, era, digits),
        isToday: isSameDay(date, today),
        isSelected: isRangeStart || (mode === 'range' && isSameDay(date, to)),
        isDisabled: isDisabled(date),
        isFocused: isSameDay(date, focused),
        isRangeStart: mode === 'range' && isRangeStart,
        isRangeEnd,
        isInRange:
          mode === 'range' &&
          !!from &&
          !!previewEnd &&
          !isBefore(date, from) &&
          !isAfter(date, previewEnd),
      });
    }
    while (cells.length % 7) cells.push(null);
    const weeks: CalendarMonth['weeks'] = [];
    for (let w = 0; w < cells.length; w += 7) weeks.push(cells.slice(w, w + 7));
    return { year, month, label: `${data.months[month]} ${formatYear(year, era, digits)}`, weeks };
  });

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const index = (i + weekStartsOn) % 7;
    return { short: data.weekdaysShort[index] ?? '', long: data.weekdays[index] ?? '' };
  });

  const minYear = minDate?.getFullYear() ?? today.getFullYear() - MIN_YEAR_SPAN;
  const maxYear = maxDate?.getFullYear() ?? today.getFullYear() + MAX_YEAR_SPAN;
  const viewYear = view.getFullYear();
  const yearOptions = useMemo<CalendarOption[]>(() => {
    const list: CalendarOption[] = [];
    const start = Math.min(minYear, viewYear);
    const end = Math.max(maxYear, viewYear);
    for (let y = end; y >= start; y--) {
      list.push({
        value: y,
        label: formatYear(y, era, digits),
        disabled: y < minYear || y > maxYear,
      });
    }
    return list;
  }, [minYear, maxYear, viewYear, era, digits]);

  const monthOptions: CalendarOption[] = data.months.map((label, month) => ({
    value: month,
    label,
    disabled:
      (!!minDate && monthDiff(minDate, createDate(viewYear, month, 1)) < 0) ||
      (!!maxDate && monthDiff(maxDate, createDate(viewYear, month, 1)) > 0),
  }));

  const firstVisible = view;
  const lastVisible = addMonths(view, numberOfMonths - 1);
  const canGoPrev = !minDate || monthDiff(minDate, firstVisible) > 0;
  const canGoNext = !maxDate || monthDiff(lastVisible, maxDate) > 0;

  const onKeyDown = (event: KeyboardEvent) => {
    const weekStart = addDays(focused, -((focused.getDay() - weekStartsOn + 7) % 7));
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => weekStart,
      End: () => addDays(weekStart, 6),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      focusDate(move());
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectDate(focused);
    }
  };

  const getGridProps = (): HTMLAttributes<HTMLDivElement> & {
    ref: typeof gridRef;
  } => ({ ref: gridRef, onKeyDown, onMouseLeave: () => setHovered(null) });

  const getDayProps = (
    day: CalendarDay,
  ): ButtonHTMLAttributes<HTMLButtonElement> & Record<`data-${string}`, boolean | undefined> => ({
    type: 'button',
    tabIndex: day.isFocused ? 0 : -1,
    'aria-label': day.ariaLabel,
    'aria-disabled': day.isDisabled || undefined,
    'aria-current': day.isToday ? 'date' : undefined,
    'data-focused': day.isFocused || undefined,
    'data-selected': day.isSelected || undefined,
    'data-today': day.isToday || undefined,
    'data-disabled': day.isDisabled || undefined,
    'data-range-start': day.isRangeStart || undefined,
    'data-range-end': day.isRangeEnd || undefined,
    'data-in-range': day.isInRange || undefined,
    onClick: () => selectDate(day.date),
    onMouseEnter: mode === 'range' ? () => setHovered(day.date) : undefined,
    onFocus: () => {
      if (!isSameDay(day.date, focused)) setFocused(day.date);
    },
  });

  return {
    months,
    weekdays,
    monthOptions,
    yearOptions,
    focusedDate: focused,
    today,
    canGoPrev,
    canGoNext,
    labels: { ...data.labels, ...options.labels },
    isDisabled,
    selectDate,
    focusDate,
    goToMonth,
    prevMonth: () => goToMonth(addMonths(view, -1).getFullYear(), addMonths(view, -1).getMonth()),
    nextMonth: () => goToMonth(addMonths(view, 1).getFullYear(), addMonths(view, 1).getMonth()),
    /** Move DOM focus to the focused day (call after opening the popover). */
    focusGrid: () => gridRef.current?.querySelector<HTMLElement>('[data-focused]')?.focus(),
    getGridProps,
    getDayProps,
  };
}

export type ThaiCalendarState = ReturnType<typeof useThaiCalendar>;
