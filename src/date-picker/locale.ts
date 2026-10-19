import type { Era } from '../core/date';
import { type Digits, withDigits } from '../core/digits';

export type Locale = 'th' | 'en';

export interface CalendarLabels {
  /** Calendar button and dialog name. */
  chooseDate: string;
  prevMonth: string;
  nextMonth: string;
  month: string;
  year: string;
  today: string;
  /** Input placeholder (mask hint). */
  placeholder: string;
  rangeStart: string;
  rangeEnd: string;
  invalid: string;
  outOfRange: string;
  unavailable: string;
  rangeOrder: string;
  /** `(dateText) => "Change date, …"` – accessible name of the button when a date is set. */
  changeDate: (formatted: string) => string;
}

export interface LocaleData {
  months: readonly string[];
  monthsShort: readonly string[];
  weekdays: readonly string[];
  weekdaysShort: readonly string[];
  labels: CalendarLabels;
}

export const th: LocaleData = {
  months: [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ],
  monthsShort: [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ],
  weekdays: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
  weekdaysShort: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
  labels: {
    chooseDate: 'เลือกวันที่',
    prevMonth: 'เดือนก่อนหน้า',
    nextMonth: 'เดือนถัดไป',
    month: 'เดือน',
    year: 'ปี',
    today: 'วันนี้',
    placeholder: 'วว/ดด/ปปปป',
    rangeStart: 'วันเริ่มต้น',
    rangeEnd: 'วันสิ้นสุด',
    invalid: 'รูปแบบวันที่ไม่ถูกต้อง',
    outOfRange: 'วันที่อยู่นอกช่วงที่เลือกได้',
    unavailable: 'ไม่สามารถเลือกวันที่นี้ได้',
    rangeOrder: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น',
    changeDate: (d) => `เปลี่ยนวันที่ (${d})`,
  },
};

export const en: LocaleData = {
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  labels: {
    chooseDate: 'Choose date',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    month: 'Month',
    year: 'Year',
    today: 'Today',
    placeholder: 'DD/MM/YYYY',
    rangeStart: 'Start date',
    rangeEnd: 'End date',
    invalid: 'Invalid date',
    outOfRange: 'Date is outside the allowed range',
    unavailable: 'This date is not available',
    rangeOrder: 'End date must not be before the start date',
    changeDate: (d) => `Change date, ${d}`,
  },
};

export const getLocale = (locale: Locale = 'th'): LocaleData => (locale === 'en' ? en : th);

/** Display year for the era: 2026 → "2569" (BE) or "2026" (CE). */
export const formatYear = (ceYear: number, era: Era, digits?: Digits): string =>
  withDigits(era === 'BE' ? ceYear + 543 : ceYear, digits);

/**
 * Full spoken date for screen readers:
 * th → "วันเสาร์ที่ 17 ตุลาคม พ.ศ. 2569", en → "Saturday, 17 October 2569 BE".
 */
export function formatLongDate(
  date: Date,
  locale: Locale = 'th',
  era: Era = 'BE',
  digits?: Digits,
): string {
  const data = getLocale(locale);
  const day = withDigits(date.getDate(), digits);
  const month = data.months[date.getMonth()];
  const weekday = data.weekdays[date.getDay()];
  const year = formatYear(date.getFullYear(), era, digits);
  if (locale === 'en') return `${weekday}, ${day} ${month} ${year}${era === 'BE' ? ' BE' : ''}`;
  return `วัน${weekday}ที่ ${day} ${month} ${era === 'BE' ? 'พ.ศ.' : 'ค.ศ.'} ${year}`;
}
