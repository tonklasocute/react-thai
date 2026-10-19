import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import { cx } from '../core/cx';
import { describedBy, Field, type FieldOwnProps, type FieldSlot } from '../core/Field';
import { mergeRefs } from '../core/refs';
import { useDigitsField } from '../core/useDigitsField';
import {
  formatThaiPhone,
  getThaiPhoneType,
  isValidThaiPhone,
  normalizeThaiPhone,
  thaiPhoneLength,
  type ThaiPhoneType,
  toE164,
} from '../validators/phone';

export interface ThaiPhoneChangeMeta {
  valid: boolean;
  type: ThaiPhoneType | null;
  /** `+66…` when valid, otherwise `null`. */
  e164: string | null;
  /** National digits, e.g. `0812345678`. */
  digits: string;
  /** Display text, e.g. `081-234-5678`. */
  formatted: string;
}

export interface ThaiPhoneInputProps
  extends
    FieldOwnProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'name'
    > {
  /** National digits (`0812345678`) or E.164 (`+66812345678`). */
  value?: string;
  defaultValue?: string;
  /** Receives national digits, or E.164 once valid when `output="e164"`. */
  onChange?: (value: string, meta: ThaiPhoneChangeMeta) => void;
  /** Accept only mobile, only landline, or both (default). */
  type?: ThaiPhoneType | 'any';
  /** Value format passed to `onChange` and the hidden input. Default `national`. */
  output?: 'national' | 'e164';
  /** Name of a hidden input with the value in the `output` format. */
  name?: string;
  locale?: 'th' | 'en';
  invalidMessage?: string;
  classNames?: Partial<Record<FieldSlot | 'input', string>>;
}

/** Thai phone input: masks `0XX-XXX-XXXX` / `02-XXX-XXXX`, validates, can output E.164. */
export const ThaiPhoneInput = forwardRef<HTMLInputElement, ThaiPhoneInputProps>(
  function ThaiPhoneInput(
    {
      value,
      defaultValue = '',
      onChange,
      onBlur,
      type = 'any',
      output = 'national',
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
      normalize: normalizeThaiPhone,
      format: formatThaiPhone,
      maxDigits: thaiPhoneLength,
      isValid: (d) => isValidThaiPhone(d, type),
      emit: (digits, valid) => {
        const e164 = valid ? toE164(digits) : null;
        return [
          output === 'e164' && e164 ? e164 : digits,
          {
            valid,
            type: getThaiPhoneType(digits),
            e164,
            digits,
            formatted: formatThaiPhone(digits),
          },
        ];
      },
      onChange,
      onBlur,
    });
    const shownError =
      error ??
      (field.showError
        ? (invalidMessage ?? (locale === 'en' ? 'Invalid phone number' : 'เบอร์โทรศัพท์ไม่ถูกต้อง'))
        : undefined);
    const hiddenValue = output === 'e164' ? (toE164(field.digits) ?? field.digits) : field.digits;

    return (
      <Field
        id={id}
        base="rt-phone"
        label={label}
        hint={hint}
        error={shownError}
        invalid={!!shownError}
        disabled={inputProps.disabled}
        className={className}
        classNames={classNames}
      >
        <input
          placeholder={type === 'landline' ? '0X-XXX-XXXX' : '0XX-XXX-XXXX'}
          autoComplete="tel-national"
          {...inputProps}
          {...field.inputProps}
          ref={mergeRefs(ref, field.inputRef)}
          id={id}
          type="tel"
          maxLength={13}
          aria-invalid={shownError ? true : inputProps['aria-invalid']}
          aria-describedby={describedBy(
            id,
            { hint, error: shownError },
            inputProps['aria-describedby'],
          )}
          className={cx('rt-input', 'rt-phone__input', classNames.input)}
        />
        {name && <input type="hidden" name={name} value={hiddenValue} />}
      </Field>
    );
  },
);
