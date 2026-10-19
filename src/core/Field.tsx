import type { ReactNode } from 'react';
import { cx } from './cx';

export type FieldSlot = 'root' | 'label' | 'hint' | 'error';

export interface FieldOwnProps {
  /** Visible label. Omit it and pass `aria-label`/`aria-labelledby` if you render your own. */
  label?: ReactNode;
  /** Helper text under the input (linked with `aria-describedby`). */
  hint?: ReactNode;
  /** Error message. Also sets `aria-invalid` on the input. */
  error?: ReactNode;
}

interface FieldProps extends FieldOwnProps {
  id: string;
  base: string;
  /** When false, the label is rendered as a `<span>` (used to label a group). */
  labelFor?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  classNames?: Partial<Record<FieldSlot, string>>;
  children: ReactNode;
}

/** Ids for the label/hint/error elements of a field. */
export const fieldIds = (id: string) => ({
  label: `${id}-label`,
  hint: `${id}-hint`,
  error: `${id}-error`,
});

export function describedBy(
  id: string,
  { hint, error }: FieldOwnProps,
  extra?: string,
): string | undefined {
  const ids = fieldIds(id);
  return (
    [extra, hint ? ids.hint : '', error ? ids.error : ''].filter(Boolean).join(' ') || undefined
  );
}

export function Field({
  id,
  base,
  label,
  hint,
  error,
  labelFor = true,
  invalid,
  disabled,
  className,
  classNames = {},
  children,
}: FieldProps) {
  const ids = fieldIds(id);
  const Label = labelFor ? 'label' : 'span';
  return (
    <div
      className={cx('rt-field', base, className, classNames.root)}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {label != null && (
        <Label
          id={ids.label}
          htmlFor={labelFor ? id : undefined}
          className={cx('rt-label', classNames.label)}
        >
          {label}
        </Label>
      )}
      {children}
      {hint != null && (
        <p id={ids.hint} className={cx('rt-hint', classNames.hint)}>
          {hint}
        </p>
      )}
      <p
        id={ids.error}
        className={cx('rt-error', classNames.error)}
        aria-live="polite"
        hidden={!error}
      >
        {error}
      </p>
    </div>
  );
}
