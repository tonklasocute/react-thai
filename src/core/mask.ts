import { type ChangeEvent, useRef } from 'react';
import { onlyDigits } from './digits';
import { useIsoLayoutEffect } from './refs';

/** `formatGroups('1101700203451', [1, 4, 5, 2, 1], '-')` → `"1-1017-00203-45-1"`. */
export function formatGroups(digits: string, groups: readonly number[], sep: string): string {
  let out = '';
  let index = 0;
  for (const size of groups) {
    if (index >= digits.length) break;
    if (index) out += sep;
    out += digits.slice(index, index + size);
    index += size;
  }
  return out;
}

const DIGIT = /[0-9๐-๙]/;

/** Caret index right after the `count`-th digit of `text`. */
export function caretAfterDigits(text: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (DIGIT.test(text.charAt(i)) && ++seen === count) return i + 1;
  }
  return text.length;
}

/**
 * Turns a raw `onChange` event into masked digits while keeping the caret where the
 * user expects it. Backspacing over a separator deletes the digit before it.
 */
export function useMaskedChange(
  format: (digits: string) => string,
  maxDigits: number,
): {
  inputRef: { current: HTMLInputElement | null };
  read: (
    event: ChangeEvent<HTMLInputElement>,
    previous: string,
  ) => { digits: string; text: string };
} {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caret = useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    const el = inputRef.current;
    if (caret.current !== null && el && el === el.ownerDocument.activeElement) {
      el.setSelectionRange(caret.current, caret.current);
    }
    caret.current = null;
  });

  const read = (event: ChangeEvent<HTMLInputElement>, previous: string) => {
    const el = event.target;
    const position = el.selectionStart ?? el.value.length;
    let digits = onlyDigits(el.value);
    let before = onlyDigits(el.value.slice(0, position)).length;
    const inputType = (event.nativeEvent as InputEvent).inputType;
    if (inputType === 'deleteContentBackward' && digits === onlyDigits(previous) && before > 0) {
      digits = digits.slice(0, before - 1) + digits.slice(before);
      before -= 1;
    }
    digits = digits.slice(0, maxDigits);
    const text = format(digits);
    caret.current = caretAfterDigits(text, Math.min(before, digits.length));
    return { digits, text };
  };

  return { inputRef, read };
}
