import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type Era, isAfter, isBefore, isSameDay } from '../core/date';
import type { Digits } from '../core/digits';
import type { FieldOwnProps, FieldSlot } from '../core/Field';
import { useMaskedChange } from '../core/mask';
import { useIsoLayoutEffect } from '../core/refs';
import { useControllable } from '../core/useControllable';
import type { CalendarSlot } from './Calendar';
import { formatDate, maskDate, parseDate } from './format';
import type { CalendarLabels, Locale } from './locale';
import type { WeekDay } from './useThaiCalendar';

export type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export type DatePickerSlot = FieldSlot | CalendarSlot | 'control' | 'input' | 'trigger' | 'popover';

/** Validation state of the typed text. */
export type DateInputStatus =
  'empty' | 'valid' | 'incomplete' | 'invalid' | 'out-of-range' | 'unavailable';

export interface BaseDatePickerProps
  extends
    FieldOwnProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'children' | 'name'
    > {
  /** UI language for month names, weekdays and labels. Default `th`. */
  locale?: Locale;
  /** Show and type years in พ.ศ. (`BE`, default) or ค.ศ. (`CE`). Values are always JS `Date`s. */
  era?: Era;
  /** Render digits as Arabic (default) or Thai numerals (๐–๙). Typing accepts both. */
  digits?: Digits;
  minDate?: Date | null;
  maxDate?: Date | null;
  /** Return `true` to disable a day. */
  isDateDisabled?: (date: Date) => boolean;
  weekStartsOn?: WeekDay;
  /** Show the "วันนี้ / Today" button. Default `true`. */
  showTodayButton?: boolean;
  /** Close the calendar after a day (or a full range) is picked. Default `true`. */
  closeOnSelect?: boolean;
  /** Controlled popover state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Preferred popover placement. It flips and shifts to stay in the viewport. Default `bottom-start`. */
  placement?: Placement;
  /** Override any built-in text (labels, validation messages). */
  labels?: Partial<CalendarLabels>;
  /** Called when the typed text becomes valid/invalid. */
  onStatusChange?: (status: DateInputStatus) => void;
  className?: string;
  classNames?: Partial<Record<DatePickerSlot, string>>;
}

export interface DateFieldOptions {
  date: Date | null;
  onDate: (date: Date | null) => void;
  era: Era;
  digits?: Digits;
  minDate?: Date | null;
  maxDate?: Date | null;
  isDateDisabled?: (date: Date) => boolean;
  onStatusChange?: (status: DateInputStatus) => void;
}

/** Text state, masking and parsing for one `DD/MM/YYYY` input bound to a `Date | null`. */
export function useDateField(o: DateFieldOptions) {
  const textOptions = { era: o.era, digits: o.digits };
  const format = (date: Date | null) => (date ? formatDate(date, textOptions) : '');
  const [text, setText] = useState(() => format(o.date));
  const [synced, setSynced] = useState(o.date);
  const [touched, setTouched] = useState(false);
  const { inputRef, read } = useMaskedChange((d) => maskDate(d, o.digits), 8);

  // Value changed from outside (prop, calendar, reset): reflect it in the text.
  if (!isSameDay(synced, o.date)) {
    setSynced(o.date);
    if (!isSameDay(parseDate(text, textOptions).date, o.date)) setText(format(o.date));
  }

  const statusOf = (value: string): DateInputStatus => {
    if (!value) return 'empty';
    const parsed = parseDate(value, textOptions);
    if (!parsed.date) return parsed.error;
    if (
      (o.minDate && isBefore(parsed.date, o.minDate)) ||
      (o.maxDate && isAfter(parsed.date, o.maxDate))
    ) {
      return 'out-of-range';
    }
    return o.isDateDisabled?.(parsed.date) ? 'unavailable' : 'valid';
  };
  const status = statusOf(text);

  const statusRef = useRef(status);
  const onStatusChange = useRef(o.onStatusChange);
  onStatusChange.current = o.onStatusChange;
  useEffect(() => {
    if (statusRef.current !== status) onStatusChange.current?.(status);
    statusRef.current = status;
  }, [status]);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = read(event, text).text;
    setText(next);
    const date = statusOf(next) === 'valid' ? parseDate(next, textOptions).date : null;
    if (!isSameDay(date, o.date)) {
      setSynced(date);
      o.onDate(date);
    }
  };

  const showError =
    status === 'invalid' ||
    status === 'out-of-range' ||
    status === 'unavailable' ||
    (status === 'incomplete' && touched);

  return {
    inputRef,
    text,
    status,
    showError,
    inputProps: {
      value: text,
      onChange,
      inputMode: 'numeric' as const,
      autoComplete: 'off',
      maxLength: 10,
    },
    markTouched: () => setTouched(true),
  };
}

export const statusMessage = (status: DateInputStatus, labels: CalendarLabels): string =>
  status === 'out-of-range'
    ? labels.outOfRange
    : status === 'unavailable'
      ? labels.unavailable
      : labels.invalid;

const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]),select:not([disabled])';

const GAP = 6;
const PAD = 8;

/** Open state, positioning, outside click, Escape and focus trap for the calendar dialog. */
export function usePickerPopover(
  props: Pick<BaseDatePickerProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'placement'>,
  returnFocusTo: () => HTMLElement | null,
) {
  const [open, setOpen] = useControllable(
    props.open,
    props.defaultOpen ?? false,
    props.onOpenChange,
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const [side, align] = (props.placement ?? 'bottom-start').split('-');

  // `position: fixed` next to the anchor; flip vertically and shift horizontally to stay on screen.
  useIsoLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = floatingRef.current;
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!el || !anchor) return;
      const { offsetWidth: width, offsetHeight: height } = el;
      const viewWidth = document.documentElement.clientWidth;
      const fitsBelow = anchor.bottom + GAP + height <= window.innerHeight - PAD;
      const fitsAbove = anchor.top - GAP - height >= PAD;
      const top = side === 'top' ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;
      const x = align === 'end' ? anchor.right - width : anchor.left;
      el.style.top = `${top ? anchor.top - GAP - height : anchor.bottom + GAP}px`;
      el.style.left = `${Math.max(PAD, Math.min(x, viewWidth - width - PAD))}px`;
      el.dataset.side = top ? 'top' : 'bottom';
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, side, align]);

  const close = (focus = true) => {
    setOpen(false);
    if (focus) returnFocusTo()?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, setOpen]);

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') {
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
      const day = event.currentTarget.querySelector<HTMLElement>('[data-focused]');
      if (day) items.push(day);
      const order = items.sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      const first = order[0];
      const last = order[order.length - 1];
      const active = event.currentTarget.ownerDocument.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  return { open, setOpen, close, rootRef, anchorRef, floatingRef, onDialogKeyDown };
}

/** Alt+ArrowDown / ArrowDown on an input opens the calendar (combobox convention). */
export const opensCalendar = (event: KeyboardEvent<HTMLInputElement>) =>
  event.key === 'ArrowDown' && (event.altKey || !event.currentTarget.value);

export const CalendarIcon = (): ReactNode => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect
      x="3.5"
      y="5"
      width="17"
      height="15.5"
      rx="2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M3.5 10h17M8 3v4M16 3v4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
