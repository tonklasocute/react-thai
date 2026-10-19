import { useEffect, useId } from 'react';
import { cx } from '../core/cx';
import { useThaiCalendar, type UseThaiCalendarOptions } from './useThaiCalendar';

export type CalendarSlot =
  | 'calendar'
  | 'header'
  | 'navButton'
  | 'select'
  | 'months'
  | 'month'
  | 'monthLabel'
  | 'grid'
  | 'weekday'
  | 'cell'
  | 'day'
  | 'footer'
  | 'todayButton';

export interface ThaiCalendarProps extends UseThaiCalendarOptions {
  className?: string;
  classNames?: Partial<Record<CalendarSlot, string>>;
  /** Move focus into the grid on mount (used by the pickers). */
  initialFocus?: boolean;
  /** Show the "วันนี้ / Today" button. Default `true`. */
  showTodayButton?: boolean;
}

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d={dir === 'left' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Inline Buddhist-calendar month grid. Used inside the pickers; also usable on its own. */
export function ThaiCalendar({
  className,
  classNames = {},
  initialFocus,
  showTodayButton = true,
  ...options
}: ThaiCalendarProps) {
  const id = useId();
  const cal = useThaiCalendar(options);
  const { labels, months, today } = cal;
  const first = months[0];

  useEffect(() => {
    if (initialFocus) cal.focusGrid();
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cx('rt-cal', className, classNames.calendar)}>
      <div className={cx('rt-cal__header', classNames.header)}>
        <button
          type="button"
          className={cx('rt-cal__nav', classNames.navButton)}
          aria-label={labels.prevMonth}
          disabled={!cal.canGoPrev}
          onClick={cal.prevMonth}
        >
          <Chevron dir="left" />
        </button>
        {first && (
          <>
            <select
              className={cx('rt-cal__select', classNames.select)}
              aria-label={labels.month}
              value={first.month}
              onChange={(e) => cal.goToMonth(first.year, Number(e.target.value))}
            >
              {cal.monthOptions.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className={cx('rt-cal__select', classNames.select)}
              aria-label={labels.year}
              value={first.year}
              onChange={(e) => cal.goToMonth(Number(e.target.value), first.month)}
            >
              {cal.yearOptions.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          type="button"
          className={cx('rt-cal__nav', classNames.navButton)}
          aria-label={labels.nextMonth}
          disabled={!cal.canGoNext}
          onClick={cal.nextMonth}
        >
          <Chevron dir="right" />
        </button>
      </div>
      <div className={cx('rt-cal__months', classNames.months)} {...cal.getGridProps()}>
        {months.map((month, m) => (
          <div
            key={`${month.year}-${month.month}`}
            className={cx('rt-cal__month', classNames.month)}
          >
            <div
              id={`${id}-m${m}`}
              className={cx(
                'rt-cal__month-label',
                months.length === 1 && 'rt-sr-only',
                classNames.monthLabel,
              )}
              aria-live="polite"
            >
              {month.label}
            </div>
            <table
              role="grid"
              aria-labelledby={`${id}-m${m}`}
              className={cx('rt-cal__grid', classNames.grid)}
            >
              <thead>
                <tr>
                  {cal.weekdays.map((w) => (
                    <th
                      key={w.long}
                      scope="col"
                      abbr={w.long}
                      className={cx('rt-cal__weekday', classNames.weekday)}
                    >
                      {w.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {month.weeks.map((week, w) => (
                  <tr key={w}>
                    {week.map((day, d) =>
                      day ? (
                        <td
                          key={d}
                          role="gridcell"
                          aria-selected={day.isSelected}
                          className={cx('rt-cal__cell', classNames.cell)}
                          data-in-range={day.isInRange || undefined}
                          data-range-start={day.isRangeStart || undefined}
                          data-range-end={day.isRangeEnd || undefined}
                        >
                          <button
                            className={cx('rt-cal__day', classNames.day)}
                            {...cal.getDayProps(day)}
                          >
                            {day.label}
                          </button>
                        </td>
                      ) : (
                        <td
                          key={d}
                          role="gridcell"
                          className={cx('rt-cal__cell', classNames.cell)}
                        />
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {showTodayButton && (
        <div className={cx('rt-cal__footer', classNames.footer)}>
          <button
            type="button"
            className={cx('rt-cal__today', classNames.todayButton)}
            disabled={cal.isDisabled(today)}
            onClick={() => cal.selectDate(today)}
          >
            {labels.today}
          </button>
        </div>
      )}
    </div>
  );
}
