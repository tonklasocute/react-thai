import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import { cx } from '../core/cx';
import { onlyDigits } from '../core/digits';
import { describedBy, Field, type FieldOwnProps, type FieldSlot } from '../core/Field';
import { mergeRefs } from '../core/refs';
import { useDigitsField } from '../core/useDigitsField';
import { formatThaiId, isValidThaiId } from '../validators/thaiId';

export interface ThaiIdChangeMeta {
  /** 13 digits with a correct check digit. */
  valid: boolean;
  /** 13 digits typed. */
  complete: boolean;
  /** `X-XXXX-XXXXX-XX-X` text. */
  formatted: string;
}

export interface ThaiIdInputProps
  extends
    FieldOwnProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'name'
    > {
  /** Digits only (dashes are added for display). */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, meta: ThaiIdChangeMeta) => void;
  /** Name of a hidden input that submits the 13 digits without dashes. */
  name?: string;
  locale?: 'th' | 'en';
  /** Message shown when the check digit is wrong or the number is incomplete. */
  invalidMessage?: string;
  classNames?: Partial<Record<FieldSlot | 'input', string>>;
}

/** Thai national ID input: masks to `X-XXXX-XXXXX-XX-X` and validates the check digit. */
export const ThaiIdInput = forwardRef<HTMLInputElement, ThaiIdInputProps>(function ThaiIdInput(
  {
    value,
    defaultValue = '',
    onChange,
    onBlur,
    name,
    locale = 'th',
    invalidMessage,
    label,
    hint,
    error,
    id: idProp,
    className,
    classNames = {},
    ...inputProps
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const field = useDigitsField({
    value,
    defaultValue,
    normalize: (s) => onlyDigits(s).slice(0, 13),
    format: formatThaiId,
    maxDigits: () => 13,
    isValid: isValidThaiId,
    emit: (digits, valid) => [
      digits,
      { valid, complete: digits.length === 13, formatted: formatThaiId(digits) },
    ],
    onChange,
    onBlur,
  });
  const shownError =
    error ??
    (field.showError
      ? (invalidMessage ??
        (locale === 'en' ? 'Invalid Thai ID number' : 'เลขประจำตัวประชาชนไม่ถูกต้อง'))
      : undefined);

  return (
    <Field
      id={id}
      base="rt-id"
      label={label}
      hint={hint}
      error={shownError}
      invalid={!!shownError}
      disabled={inputProps.disabled}
      className={className}
      classNames={classNames}
    >
      <input
        placeholder="X-XXXX-XXXXX-XX-X"
        autoComplete="off"
        {...inputProps}
        {...field.inputProps}
        ref={mergeRefs(ref, field.inputRef)}
        id={id}
        type="text"
        maxLength={17}
        aria-invalid={shownError ? true : inputProps['aria-invalid']}
        aria-describedby={describedBy(
          id,
          { hint, error: shownError },
          inputProps['aria-describedby'],
        )}
        className={cx('rt-input', 'rt-id__input', classNames.input)}
      />
      {name && <input type="hidden" name={name} value={field.digits} />}
    </Field>
  );
});
