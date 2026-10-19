import { onlyDigits } from '../core/digits';
import { formatGroups } from '../core/mask';

/** Group sizes of the `X-XXXX-XXXXX-XX-X` mask. */
export const THAI_ID_GROUPS = [1, 4, 5, 2, 1] as const;

/** Check digit for the first 12 digits: (11 − Σ dᵢ·(13−i) mod 11) mod 10. */
export function thaiIdCheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (13 - i);
  return (11 - (sum % 11)) % 10;
}

/** `true` for a 13-digit Thai national ID with a valid check digit. Dashes/spaces are ignored. */
export function isValidThaiId(input: string): boolean {
  const digits = onlyDigits(input);
  return digits.length === 13 && thaiIdCheckDigit(digits) === Number(digits[12]);
}

/** `"1101700203451"` → `"1-1017-00203-45-1"` (partial input is formatted as far as it goes). */
export const formatThaiId = (input: string): string =>
  formatGroups(onlyDigits(input).slice(0, 13), THAI_ID_GROUPS, '-');
