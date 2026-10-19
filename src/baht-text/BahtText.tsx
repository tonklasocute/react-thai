import type { HTMLAttributes } from 'react';
import { cx } from '../core/cx';
import { bahtText } from './words';

export interface BahtTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Amount in baht. Use a string or bigint for exact values beyond 2^53. */
  value: number | string | bigint;
  /** Rendered instead of throwing when `value` is not a valid amount. Default: empty. */
  fallback?: string;
}

/** Renders an amount as Thai words: `<BahtText value={1234.5} />`. Works in Server Components. */
export function BahtText({ value, fallback = '', className, ...rest }: BahtTextProps) {
  let text = fallback;
  try {
    text = bahtText(value);
  } catch {
    // keep fallback
  }
  return (
    <span className={cx('rt-baht', className)} {...rest}>
      {text}
    </span>
  );
}
