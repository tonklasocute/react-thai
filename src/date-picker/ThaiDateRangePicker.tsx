import { forwardRef, useId } from 'react';
import { cx } from '../core/cx';
import { isBefore, toISODate } from '../core/date';
import { describedBy, Field, fieldIds } from '../core/Field';
import { mergeRefs } from '../core/refs';
import { useControllable } from '../core/useControllable';
import { ThaiCalendar } from './Calendar';
import { getLocale } from './locale';
import {
  type BaseDatePickerProps,
  CalendarIcon,
  opensCalendar,
  statusMessage,
  useDateField,
  usePickerPopover,
} from './shared';
import type { DateRange } from './useThaiCalendar';

const EMPTY: DateRange = { from: null, to: null };

export interface ThaiDateRangePickerProps extends BaseDatePickerProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  /** Hidden input name for the start date (`YYYY-MM-DD`). */
  startName?: string;
  /** Hidden input name for the end date (`YYYY-MM-DD`). */
  endName?: string;
  /** Months shown side by side in the popover. Default `2`. */
  numberOfMonths?: number;
}

/** Two linked `DD/MM/YYYY` inputs with a shared range calendar. Ref goes to the start input. */
export const ThaiDateRangePicker = forwardRef<HTMLInputElement, ThaiDateRangePickerProps>(
  function ThaiDateRangePicker(props, ref) {
    const {
      value,
      defaultValue = EMPTY,
      onChange,
      startName,
      endName,
      numberOfMonths = 2,
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
    const [range, setRange] = useControllable(value, defaultValue, onChange);
    const common = { era, digits, minDate, maxDate, isDateDisabled, onStatusChange };
    const start = useDateField({
      ...common,
      date: range.from,
      onDate: (from) => setRange({ ...range, from }),
    });
    const end = useDateField({
      ...common,
      date: range.to,
      onDate: (to) => setRange({ ...range, to }),
    });
    const popover = usePickerPopover(props, () => start.inputRef.current);

    const orderError = !!range.from && !!range.to && isBefore(range.to, range.from);
    const failing = start.showError ? start : end.showError ? end : null;
    const shownError =
      error ??
      (failing
        ? statusMessage(failing.status, labels)
        : orderError
          ? labels.rangeOrder
          : undefined);

    const describe = describedBy(id, { hint, error: shownError }, inputProps['aria-describedby']);
    const inputs = [
      { field: start, key: 'start', name: startName, date: range.from, label: labels.rangeStart },
      { field: end, key: 'end', name: endName, date: range.to, label: labels.rangeEnd },
    ] as const;

    return (
      <Field
        id={id}
        base="rt-dp rt-dp--range"
        label={label}
        labelFor={false}
        hint={hint}
        error={shownError}
        invalid={!!shownError}
        disabled={disabled}
        className={className}
        classNames={classNames}
      >
        <div ref={popover.rootRef} className="rt-dp__anchor">
          <div
            ref={popover.anchorRef}
            role="group"
            aria-labelledby={label != null ? fieldIds(id).label : undefined}
            aria-label={label == null ? labels.chooseDate : undefined}
            className={cx('rt-dp__control', classNames.control)}
          >
            {inputs.map(({ field, key, label: inputLabel }) => (
              <input
                key={key}
                placeholder={labels.placeholder}
                {...inputProps}
                {...field.inputProps}
                ref={key === 'start' ? mergeRefs(ref, field.inputRef) : field.inputRef}
                id={key === 'start' ? id : `${id}-end`}
                type="text"
                aria-label={inputLabel}
                disabled={disabled}
                readOnly={readOnly}
                aria-invalid={
                  field.showError || (key === 'end' && orderError) || !!error || undefined
                }
                aria-describedby={describe}
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
            ))}
            <button
              type="button"
              className={cx('rt-dp__trigger', classNames.trigger)}
              aria-label={labels.chooseDate}
              aria-haspopup="dialog"
              aria-expanded={popover.open}
              aria-controls={popover.open ? `${id}-dialog` : undefined}
              disabled={disabled || readOnly}
              onClick={() => popover.setOpen(!popover.open)}
            >
              <CalendarIcon />
            </button>
          </div>
          {inputs.map(
            ({ key, name, date }) =>
              name && (
                <input key={key} type="hidden" name={name} value={date ? toISODate(date) : ''} />
              ),
          )}
          {popover.open && (
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <div
              ref={popover.floatingRef}
              id={`${id}-dialog`}
              role="dialog"
              aria-modal="true"
              aria-label={labels.chooseDate}
              className={cx('rt-dp__popover', classNames.popover)}
              onKeyDown={popover.onDialogKeyDown}
            >
              <ThaiCalendar
                initialFocus
                mode="range"
                range={range}
                onRangeSelect={(next) => {
                  setRange(next);
                  if (next.to && closeOnSelect) {
                    popover.close(false);
                    end.inputRef.current?.focus();
                  }
                }}
                numberOfMonths={numberOfMonths}
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
