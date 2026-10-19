import { toArabicDigits } from '../core/digits';

/**
 * Five digits with a valid Thai province prefix (10–96). This is a format check; use
 * `react-thai/address` to check that the postcode actually exists.
 */
export function isValidThaiPostcode(input: string): boolean {
  const value = toArabicDigits(input.trim());
  return (
    /^\d{5}$/.test(value) && Number(value.slice(0, 2)) >= 10 && Number(value.slice(0, 2)) <= 96
  );
}
