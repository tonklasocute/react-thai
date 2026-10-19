/**
 * Calendar-day helpers. Every function works with *local* year/month/day parts and
 * never goes through UTC (`toISOString`, `Date.UTC`, `new Date('YYYY-MM-DD')`), so a
 * date picked in Bangkok is the same day in Los Angeles or Kiritimati.
 */

/** Difference between Buddhist Era (พ.ศ.) and Common Era (ค.ศ.) years. */
export const BE_OFFSET = 543;

export type Era = 'BE' | 'CE';

export const toBEYear = (ceYear: number): number => ceYear + BE_OFFSET;
export const toCEYear = (beYear: number): number => beYear - BE_OFFSET;

/** Local midnight for the given parts. Months are 0-based; overflow rolls over like `Date`. */
export function createDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  // setFullYear avoids the 0–99 → 1900–1999 mapping of the Date constructor.
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const daysInMonth = (year: number, month: number): number =>
  createDate(year, month + 1, 0).getDate();

export const startOfDay = (date: Date): Date =>
  createDate(date.getFullYear(), date.getMonth(), date.getDate());

export const startOfMonth = (date: Date): Date =>
  createDate(date.getFullYear(), date.getMonth(), 1);

/** Sortable integer for a calendar day, e.g. 2026-10-17 → 20261017. */
export const dayKey = (date: Date): number =>
  date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();

export const isSameDay = (a: Date | null | undefined, b: Date | null | undefined): boolean =>
  a === b || (!!a && !!b && dayKey(a) === dayKey(b));

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const addDays = (date: Date, amount: number): Date =>
  createDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);

/** Add months, clamping the day (31 Jan + 1 month → 28/29 Feb). */
export function addMonths(date: Date, amount: number): Date {
  const first = createDate(date.getFullYear(), date.getMonth() + amount, 1);
  const day = Math.min(date.getDate(), daysInMonth(first.getFullYear(), first.getMonth()));
  return createDate(first.getFullYear(), first.getMonth(), day);
}

/** Months between the first day of `a` and the first day of `b` (b − a). */
export const monthDiff = (a: Date, b: Date): number =>
  (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();

export const isBefore = (a: Date, b: Date): boolean => dayKey(a) < dayKey(b);
export const isAfter = (a: Date, b: Date): boolean => dayKey(a) > dayKey(b);

export function clampDay(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && isBefore(date, min)) return startOfDay(min);
  if (max && isAfter(date, max)) return startOfDay(max);
  return date;
}

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

/** `YYYY-MM-DD` from local parts (CE). Use this for form values and APIs. */
export const toISODate = (date: Date): string =>
  `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Parse `YYYY-MM-DD` (CE) as a local date. Returns `null` for anything else. */
export function fromISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  return m <= 11 && d >= 1 && d <= daysInMonth(y, m) ? createDate(y, m, d) : null;
}
