import { onlyDigits } from '../core/digits';
import { formatGroups } from '../core/mask';

export type ThaiPhoneType = 'mobile' | 'landline';

/**
 * Digits in national format. Accepts `+66`/`66` country code, spaces, dashes and Thai digits:
 * `"+66 81 234 5678"` → `"0812345678"`.
 */
export function normalizeThaiPhone(input: string): string {
  const digits = onlyDigits(input);
  return digits.startsWith('66') && (input.trim().startsWith('+') || digits.length >= 10)
    ? `0${digits.slice(2)}`
    : digits;
}

/** `mobile` for 06/08/09, `landline` for 02–05/07, otherwise `null`. */
export function getThaiPhoneType(input: string): ThaiPhoneType | null {
  const digits = normalizeThaiPhone(input);
  if (/^0[689]/.test(digits)) return 'mobile';
  if (/^0[2-57]/.test(digits)) return 'landline';
  return null;
}

/** Expected digit count: 10 for mobile, 9 for landline. */
export const thaiPhoneLength = (input: string): number =>
  getThaiPhoneType(input) === 'landline' ? 9 : 10;

/** Validate a Thai phone number, optionally restricted to mobile or landline. */
export function isValidThaiPhone(input: string, type: ThaiPhoneType | 'any' = 'any'): boolean {
  const digits = normalizeThaiPhone(input);
  const actual = getThaiPhoneType(digits);
  return (
    !!actual && (type === 'any' || type === actual) && digits.length === thaiPhoneLength(digits)
  );
}

/** `0812345678` → `081-234-5678`, `021234567` → `02-123-4567`, `053123456` → `053-123-456`. */
export function formatThaiPhone(input: string): string {
  const digits = normalizeThaiPhone(input);
  const groups = digits.startsWith('02')
    ? [2, 3, 4]
    : getThaiPhoneType(digits) === 'landline'
      ? [3, 3, 3]
      : [3, 3, 4];
  return formatGroups(digits.slice(0, thaiPhoneLength(digits)), groups, '-');
}

/** `0812345678` → `+66812345678`. Returns `null` for invalid numbers. */
export const toE164 = (input: string): string | null =>
  isValidThaiPhone(input) ? `+66${normalizeThaiPhone(input).slice(1)}` : null;
