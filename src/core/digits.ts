const THAI_ZERO = 0x0e50;

/** Digit style used when rendering numbers. */
export type Digits = 'arabic' | 'thai';

/** `"2569"` → `"๒๕๖๙"`. Non-digit characters are kept. */
export const toThaiDigits = (input: string | number): string =>
  String(input).replace(/\d/g, (d) => String.fromCharCode(THAI_ZERO + Number(d)));

/** `"๒๕๖๙"` → `"2569"`. Non-digit characters are kept. */
export const toArabicDigits = (input: string): string =>
  input.replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - THAI_ZERO));

/** Strip everything except digits (Thai digits are converted first). */
export const onlyDigits = (input: string): string => toArabicDigits(input).replace(/\D/g, '');

/** Render a number or string with the requested digit style. */
export const withDigits = (input: string | number, digits: Digits | undefined): string =>
  digits === 'thai' ? toThaiDigits(input) : String(input);
