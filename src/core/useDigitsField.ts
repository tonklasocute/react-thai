import { type ChangeEvent, type FocusEvent, useState } from 'react';
import { useMaskedChange } from './mask';
import { useControllable } from './useControllable';

export interface DigitsFieldOptions<M> {
  value: string | undefined;
  defaultValue: string;
  /** Turn any accepted input (e.g. +66…) into plain digits. */
  normalize: (input: string) => string;
  format: (digits: string) => string;
  maxDigits: (digits: string) => number;
  /** Validity once the user has typed enough digits. */
  isValid: (digits: string) => boolean;
  /** Value + metadata passed to `onChange`. */
  emit: (digits: string, valid: boolean) => [string, M];
  onChange?: (value: string, meta: M) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}

/** Shared state for digit-only masked inputs (Thai ID, phone). */
export function useDigitsField<M>(o: DigitsFieldOptions<M>) {
  const [raw, setRaw] = useControllable(o.value, o.defaultValue);
  const [touched, setTouched] = useState(false);
  const digits = o.normalize(raw ?? '');
  const max = o.maxDigits(digits);
  const complete = digits.length >= max;
  const valid = o.isValid(digits);
  const { inputRef, read } = useMaskedChange(o.format, 15);
  const text = o.format(digits);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    let next = read(event, text).digits;
    next = o.normalize(event.target.value.trim().startsWith('+') ? event.target.value : next);
    next = next.slice(0, o.maxDigits(next));
    const [value, meta] = o.emit(next, o.isValid(next));
    setRaw(value);
    o.onChange?.(value, meta);
  };

  return {
    inputRef,
    digits,
    valid,
    showError: (complete && !valid) || (touched && digits.length > 0 && !complete),
    inputProps: {
      value: text,
      onChange,
      onBlur: (event: FocusEvent<HTMLInputElement>) => {
        setTouched(true);
        o.onBlur?.(event);
      },
      inputMode: 'numeric' as const,
    },
  };
}
