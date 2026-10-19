import { forwardRef, useId } from 'react';
import { cx } from '../core/cx';
import { toISODate } from '../core/date';
import { describedBy, Field } from '../core/Field';
import { mergeRefs } from '../core/refs';
import { useControllable } from '../core/useControllable';
import { ThaiCalendar } from './Calendar';
import { formatLongDate, getLocale } from './locale';
import {
  type BaseDatePickerProps,
  CalendarIcon,
  opensCalendar,
  statusMessage,
  useDateField,
  usePickerPopover,
} from './shared';

export interface ThaiDatePickerProps extends BaseDatePickerProps {
  /** Selected date (CE `Date` at local midnight), or `null` for empty. */
  value?: Date | null;
  defaultValue?: Date | null;
  /** Called with a `Date` when the input holds a valid, enabled date, otherwise `null`. */
  onChange?: (date: Date | null) => void;
  /** Name of a hidden input carrying the value as `YYYY-MM-DD` (CE) for native forms. */
  name?: string;
}

/**
 * Date input with a Buddhist-calendar popover. Users see and type พ.ศ. years
 * (`17/10/2569`); your code receives a plain `Date`.
 */
export const ThaiDatePicker = forwardRef<HTMLInputElement, ThaiDatePickerProps>(
  function ThaiDatePicker(props, ref) {
    const {
      value,
      defaultValue = null,
      onChange,
      name,
      locale = 'th',
      era = 'BE',
      digits,
      minDate,
      maxDate,
      isDateDisabled,
      weekStartsOn,
      showTodayButton,
      closeOnSelect = true,
      open: _open,
      defaultOpen: _defaultOpen,
      onOpenChange: _onOpenChange,
      placement: _placement,
      labels: labelOverrides,
      onStatusChange,
      label,
      hint,
      error,
      className,
      classNames = {},
      id: idProp,
      disabled,
      readOnly,
      onBlur,
      onKeyDown,
      ...inputProps
    } = props;
    const autoId = useId();
    const id = idProp ?? autoId;
    const labels = { ...getLocale(locale).labels, ...labelOverrides };
    const [date, setDate] = useControllable(value, defaultValue, onChange);
    const field = useDateField({
      date,
      onDate: setDate,
      era,
      digits,
      minDate,
      maxDate,
      isDateDisabled,
      onStatusChange,
    });
    const popover = usePickerPopover(props, () => field.inputRef.current);
    const shownError = error ?? (field.showError ? statusMessage(field.status, labels) : undefined);
    const dialogId = `${id}-dialog`;

    return (
      <Field
        id={id}
        base="rt-dp"
        label={label}
        hint={hint}
        error={shownError}
        invalid={!!shownError}
        disabled={disabled}
        className={className}
        classNames={classNames}
      >
        <div ref={popover.rootRef} className="rt-dp__anchor">
          <div ref={popover.anchorRef} className={cx('rt-dp__control', classNames.control)}>
            <input
              placeholder={labels.placeholder}
              {...inputProps}
              {...field.inputProps}
              ref={mergeRefs(ref, field.inputRef)}
              id={id}
              type="text"
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={shownError ? true : inputProps['aria-invalid']}
              aria-describedby={describedBy(
                id,
                { hint, error: shownError },
                inputProps['aria-describedby'],
              )}
              className={cx('rt-input', 'rt-dp__input', classNames.input)}
              onKeyDown={(e) => {
                onKeyDown?.(e);
                if (opensCalendar(e)) {
                  e.preventDefault();
                  popover.setOpen(true);
                }
              }}
              onBlur={(e) => {
                field.markTouched();
                onBlur?.(e);
              }}
            />
            <button
              type="button"
              className={cx('rt-dp__trigger', classNames.trigger)}
              aria-label={
                date
                  ? labels.changeDate(formatLongDate(date, locale, era, digits))
                  : labels.chooseDate
              }
              aria-haspopup="dialog"
              aria-expanded={popover.open}
              aria-controls={popover.open ? dialogId : undefined}
              disabled={disabled || readOnly}
              onClick={() => popover.setOpen(!popover.open)}
            >
              <CalendarIcon />
            </button>
          </div>
          {name && <input type="hidden" name={name} value={date ? toISODate(date) : ''} />}
          {popover.open && (
            // The dialog handles Escape and Tab for the focus trap.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <div
              ref={popover.floatingRef}
              id={dialogId}
              role="dialog"
              aria-modal="true"
              aria-label={labels.chooseDate}
              className={cx('rt-dp__popover', classNames.popover)}
              onKeyDown={popover.onDialogKeyDown}
            >
              <ThaiCalendar
                initialFocus
                selected={date}
                onSelect={(next) => {
                  setDate(next);
                  if (closeOnSelect) popover.close();
                }}
                locale={locale}
                era={era}
                digits={digits}
                minDate={minDate}
                maxDate={maxDate}
                isDateDisabled={isDateDisabled}
                weekStartsOn={weekStartsOn}
                showTodayButton={showTodayButton}
                labels={labelOverrides}
                classNames={classNames}
              />
            </div>
          )}
        </div>
      </Field>
    );
  },
);
