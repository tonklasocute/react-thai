import { createDate, daysInMonth, type Era, toCEYear } from '../core/date';
import { type Digits, toArabicDigits, withDigits } from '../core/digits';
import { formatGroups } from '../core/mask';
import { formatYear } from './locale';

export interface DateTextOptions {
  /** Year shown/typed in พ.ศ. (`BE`, default) or ค.ศ. (`CE`). */
  era?: Era;
  /** Render digits as Arabic (default) or Thai (๐–๙). Parsing accepts both. */
  digits?: Digits;
}

/** `17/10/2569` (BE) or `17/10/2026` (CE). */
export function formatDate(date: Date, { era = 'BE', digits }: DateTextOptions = {}): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${withDigits(dd, digits)}/${withDigits(mm, digits)}/${formatYear(date.getFullYear(), era, digits)}`;
}

/** Format raw digits as the `DD/MM/YYYY` mask. */
export const maskDate = (digits: string, digitStyle?: Digits): string =>
  withDigits(formatGroups(digits, [2, 2, 4], '/'), digitStyle);

export type DateParseError = 'incomplete' | 'invalid';

export type DateParseResult = { date: Date; error: null } | { date: null; error: DateParseError };

/**
 * Parse `D/M/YYYY` text (also `-` or `.` separators, Thai or Arabic digits).
 * The year is read as BE when `era` is `BE`. Impossible dates such as 31/04 or
 * 29/02 in a non-leap year are rejected instead of rolling over.
 */
export function parseDate(text: string, { era = 'BE' }: DateTextOptions = {}): DateParseResult {
  const value = toArabicDigits(text.trim());
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value);
  if (!match)
    return { date: null, error: value.replace(/\D/g, '').length < 8 ? 'incomplete' : 'invalid' };
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = era === 'BE' ? toCEYear(Number(match[3])) : Number(match[3]);
  if (month < 0 || month > 11 || day < 1 || year < 1 || day > daysInMonth(year, month)) {
    return { date: null, error: 'invalid' };
  }
  return { date: createDate(year, month, day), error: null };
}
