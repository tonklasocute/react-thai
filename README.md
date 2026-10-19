# react-thai

**Accessible React components for Thai forms: a Buddhist-calendar (พ.ศ.) date picker and Thai address autocomplete.**

[ภาษาไทย](./README.th.md) · [Storybook](https://tonklasocute.github.io/react-thai) · [Changelog](./CHANGELOG.md)

[![npm](https://img.shields.io/npm/v/react-thai?color=0f766e)](https://www.npmjs.com/package/react-thai)
[![date picker size](https://deno.bundlejs.com/badge?q=react-thai/date-picker&treeshake=%5B%7BThaiDatePicker%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22react%22%2C%22react-dom%22%2C%22react%2Fjsx-runtime%22%5D%7D%7D)](https://bundlejs.com/?q=react-thai/date-picker&treeshake=%5B%7BThaiDatePicker%7D%5D)
[![CI](https://github.com/tonklasocute/react-thai/actions/workflows/ci.yml/badge.svg)](https://github.com/tonklasocute/react-thai/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-thai)](./LICENSE)
[![Storybook](https://img.shields.io/badge/storybook-live-ff4785?logo=storybook&logoColor=white)](https://tonklasocute.github.io/react-thai)

| ThaiDatePicker                                                                    | ThaiAddressInput                                                      |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ![Typing 29/02/2567 and picking a date with the keyboard](./docs/date-picker.gif) | ![Typing บางรัก and 50200 and picking an address](./docs/address.gif) |

- **ThaiDatePicker / ThaiDateRangePicker**: users see and type พ.ศ. years (`17/10/2569`). Your code gets a plain JavaScript `Date`, so the backend never sees a 2569.
- **ThaiAddressInput**: type a postcode, ตำบล/แขวง, อำเภอ/เขต or จังหวัด and pick one suggestion to fill all four fields. It uses แขวง/เขต in Bangkok and ตำบล/อำเภอ elsewhere. The 7,436-row dataset is lazy-loaded and never lands in your main bundle.
- **ThaiIdInput, ThaiPhoneInput, BahtText**: smaller helpers for masking, validation and baht text.
- Headless hooks (`useThaiCalendar`, `useThaiAddress`), an optional CSS-variable theme with dark mode, `"use client"` boundaries for Next.js, zero runtime dependencies.

## Install

```bash
npm install react-thai
# pnpm add react-thai · yarn add react-thai
```

Peer dependencies: `react` and `react-dom` 18 or 19. `zod` 3.23+ or 4 is optional (only for `react-thai/zod`).

## Quick start

```tsx
import { useState } from 'react';
import { ThaiDatePicker } from 'react-thai/date-picker';
import { ThaiAddressInput, type ThaiAddress } from 'react-thai/address';
import 'react-thai/styles.css'; // optional default theme

export function Example() {
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [address, setAddress] = useState<ThaiAddress | null>(null);

  return (
    <>
      <ThaiDatePicker label="วันเกิด" value={birthday} onChange={setBirthday} />
      <ThaiAddressInput label="ที่อยู่" value={address} onChange={setAddress} />
    </>
  );
}
```

Every component is also exported from the root (`import { ThaiDatePicker } from 'react-thai'`). The subpaths keep your imports explicit, and tree-shaking works with either.

| Import path              | Contents                                                                                 | `"use client"`   |
| ------------------------ | ---------------------------------------------------------------------------------------- | ---------------- |
| `react-thai/date-picker` | `ThaiDatePicker`, `ThaiDateRangePicker`, `ThaiCalendar`, `useThaiCalendar`, date helpers | yes              |
| `react-thai/address`     | `ThaiAddressInput`, `useThaiAddress`, `searchAddresses`, `formatThaiAddress`             | yes              |
| `react-thai/thai-id`     | `ThaiIdInput` + ID helpers                                                               | yes              |
| `react-thai/phone`       | `ThaiPhoneInput` + phone helpers                                                         | yes              |
| `react-thai/baht-text`   | `BahtText`, `bahtText()`                                                                 | no (server-safe) |
| `react-thai/validators`  | pure validators and formatters                                                           | no (server-safe) |
| `react-thai/zod`         | zod schemas                                                                              | no (server-safe) |
| `react-thai/styles.css`  | optional theme                                                                           | n/a              |

## ThaiDatePicker

```tsx
import { ThaiDatePicker, toISODate } from 'react-thai/date-picker';

<ThaiDatePicker
  label="วันนัดหมาย"
  hint="จันทร์–ศุกร์ ภายใน 60 วัน"
  minDate={new Date()}
  isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
  onChange={(date) => date && console.log(toISODate(date))} // "2026-10-17"
/>;
```

- The input masks `DD/MM/YYYY` as you type (`17102569` becomes `17/10/2569`). It accepts Thai digits (`๑๗/๑๐/๒๕๖๙`) and rejects impossible dates such as `29/02/2569` or `31/04/2569` instead of rolling them over.
- `onChange` receives a `Date` at **local midnight** for a valid, enabled date, otherwise `null`. Incomplete or invalid text shows an error (`aria-invalid` + message) and emits `null`.
- No UTC conversions anywhere. Tests run in `Asia/Bangkok`, `America/Los_Angeles`, `Pacific/Kiritimati` (UTC+14) and `America/Santiago` (midnight DST). Send dates to your API with `toISODate(date)`, not `date.toISOString()`.
- `name="birthday"` adds a hidden input that submits `YYYY-MM-DD` (CE) with a native `<form>`.

| Prop                                    | Type                                                         | Default          | Description                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value` / `defaultValue`                | `Date \| null`                                               |                  | Controlled / uncontrolled value. `null` is a controlled empty value.                                                                                            |
| `onChange`                              | `(date: Date \| null) => void`                               |                  | Called with a valid date or `null`.                                                                                                                             |
| `name`                                  | `string`                                                     |                  | Hidden input with the ISO date (CE).                                                                                                                            |
| `locale`                                | `'th' \| 'en'`                                               | `'th'`           | Month names, weekdays and labels.                                                                                                                               |
| `era`                                   | `'BE' \| 'CE'`                                               | `'BE'`           | Year shown and typed: พ.ศ. or ค.ศ.                                                                                                                              |
| `digits`                                | `'arabic' \| 'thai'`                                         | `'arabic'`       | Display digits (๐–๙). Typing accepts both.                                                                                                                      |
| `minDate` / `maxDate`                   | `Date \| null`                                               |                  | Inclusive bounds; also limit the year dropdown.                                                                                                                 |
| `isDateDisabled`                        | `(date: Date) => boolean`                                    |                  | Disable specific days.                                                                                                                                          |
| `weekStartsOn`                          | `0`–`6`                                                      | `0` (Sunday)     | First column of the grid.                                                                                                                                       |
| `showTodayButton`                       | `boolean`                                                    | `true`           | "วันนี้ / Today" button.                                                                                                                                        |
| `closeOnSelect`                         | `boolean`                                                    | `true`           | Close the calendar after picking.                                                                                                                               |
| `open` / `defaultOpen` / `onOpenChange` |                                                              |                  | Control the popover.                                                                                                                                            |
| `placement`                             | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end'` | `'bottom-start'` | Preferred side; flips and shifts to stay on screen.                                                                                                             |
| `label` / `hint` / `error`              | `ReactNode`                                                  |                  | Field label, help text, error (sets `aria-invalid`). An `error` replaces built-in validation messages.                                                          |
| `labels`                                | `Partial<CalendarLabels>`                                    |                  | Override any built-in text.                                                                                                                                     |
| `onStatusChange`                        | `(status) => void`                                           |                  | `'empty' \| 'valid' \| 'incomplete' \| 'invalid' \| 'out-of-range' \| 'unavailable'`.                                                                           |
| `className` / `classNames`              | `string` / `Partial<Record<Slot, string>>`                   |                  | Slots: `root label hint error control input trigger popover calendar header navButton select months month monthLabel grid weekday cell day footer todayButton`. |
| …rest                                   | `InputHTMLAttributes`                                        |                  | Passed to the text input (`id`, `placeholder`, `disabled`, `aria-*`, …). The `ref` goes to the input.                                                           |

### ThaiDateRangePicker

```tsx
import { ThaiDateRangePicker, type DateRange } from 'react-thai/date-picker';

const [range, setRange] = useState<DateRange>({ from: null, to: null });
<ThaiDateRangePicker
  label="ช่วงวันลา"
  value={range}
  onChange={setRange}
  startName="from"
  endName="to"
/>;
```

It takes the same props as `ThaiDatePicker`, plus `value`/`defaultValue`/`onChange` with `{ from, to }`, `startName`/`endName` for hidden inputs, and `numberOfMonths` (default `2`). It shows a hover preview and an error when the end is before the start.

### useThaiCalendar (headless)

```tsx
const cal = useThaiCalendar({ selected, onSelect: setSelected, locale: 'th', era: 'BE' });
// cal.months[0].label → "ตุลาคม 2569", cal.months[0].weeks → CalendarDay | null cells
// spread cal.getGridProps() on the grid wrapper and cal.getDayProps(day) on each day button
```

It returns `months`, `weekdays`, `monthOptions`, `yearOptions` (BE labels), `prevMonth`, `nextMonth`, `goToMonth`, `selectDate`, `focusDate`, `canGoPrev`, `canGoNext`, `getGridProps` and `getDayProps`. It also handles the full keyboard model. The **HeadlessHook** story shows a complete custom calendar.

Helpers: `formatDate`, `parseDate`, `formatLongDate`, `toISODate`, `fromISODate`, `toBEYear`, `toCEYear`, `isLeapYear`, `toThaiDigits`, `toArabicDigits`.

## ThaiAddressInput

```tsx
import { ThaiAddressInput, formatThaiAddress, type ThaiAddress } from 'react-thai/address';

<ThaiAddressInput
  label="ที่อยู่จัดส่ง"
  fields="split" // or "search" (default): one search box
  onChange={(a) => a && console.log(formatThaiAddress(a))}
  // "แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร 10200"
/>;
```

The value is a `ThaiAddress`:

```ts
{
  subdistrict: 'สุเทพ',
  district: 'เมืองเชียงใหม่',
  province: 'เชียงใหม่',
  postcode: '50200',
  isBangkok: false,
  subdistrictPrefix: 'ตำบล', // 'แขวง' in Bangkok
  districtPrefix: 'อำเภอ', // 'เขต' in Bangkok
  en?: { subdistrict: 'Suthep', district: 'Mueang Chiang Mai', province: 'Chiang Mai' }, // with includeEnglish
}
```

- **Search**: matches by prefix and by "contains". Exact names rank first, then prefixes, then substrings. Postcodes match from the start. Multi-word queries must match every word, and a match on the whole phrase ranks higher (`เมือง เชียงใหม่` finds อำเภอเมืองเชียงใหม่). Typed prefixes such as `ต.`, `ตำบล`, `อ.`, `เขต` or `จ.` are ignored, `กทม` means Bangkok, whitespace is normalized, and `ํา` is matched as `ำ`. The matched part is highlighted with `<mark>`.
- **Lazy data**: the dataset loads on first focus with a dynamic `import()`. That is 58 kB gzip for Thai, plus 32 kB gzip for English names with `includeEnglish`.
- **Only real addresses**: `onChange` emits a complete address picked from the dataset, or `null` once the user edits the text again.
- `name="address"` adds hidden inputs `address.subdistrict`, `address.district`, `address.province` and `address.postcode`.

| Prop                                                           | Type                                     | Default    | Description                                                                                                                  |
| -------------------------------------------------------------- | ---------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `value` / `defaultValue`                                       | `ThaiAddress \| null`                    |            | Controlled / uncontrolled value.                                                                                             |
| `onChange`                                                     | `(address: ThaiAddress \| null) => void` |            |                                                                                                                              |
| `onBlur`                                                       | `() => void`                             |            | For form libraries.                                                                                                          |
| `fields`                                                       | `'search' \| 'split'`                    | `'search'` | One search box, or four linked inputs (labels switch to แขวง/เขต for Bangkok).                                               |
| `includeEnglish`                                               | `boolean`                                | `false`    | Load English names, show them and match English queries.                                                                     |
| `limit`                                                        | `number`                                 | `10`       | Max suggestions.                                                                                                             |
| `locale`                                                       | `'th' \| 'en'`                           | `'th'`     | UI labels.                                                                                                                   |
| `labels`                                                       | `Partial<AddressLabels>`                 |            | Override text (placeholders, field labels, status messages).                                                                 |
| `placeholder`                                                  | `string`                                 |            | Search box placeholder.                                                                                                      |
| `name`                                                         | `string`                                 |            | Prefix for hidden inputs.                                                                                                    |
| `label` / `hint` / `error`                                     | `ReactNode`                              |            | Field label, help text, error.                                                                                               |
| `id`, `disabled`, `required`, `aria-label`, `aria-describedby` |                                          |            | Applied to the (first) input. The `ref` goes there too.                                                                      |
| `className` / `classNames`                                     |                                          |            | Slots: `root label hint error grid field fieldLabel combobox input listbox option optionMain optionSub postcode mark empty`. |

### useThaiAddress (headless)

```tsx
const { status, search, lookupPostcode } = useThaiAddress({
  includeEnglish: false,
  preload: true,
  limit: 10,
});
// status: 'idle' | 'loading' | 'ready' | 'error'
search('บางรัก'); // AddressSuggestion[] → { id, address, matches: { district: { start, end, lang } } }
search('เชียงใหม่', { field: 'province', limit: 5 });
lookupPostcode('10200'); // ThaiAddress[]
```

Outside React: `await loadThaiAddressIndex()`, then `searchAddresses(index, query, options)`.

## Small inputs

```tsx
import { ThaiIdInput } from 'react-thai/thai-id';
import { ThaiPhoneInput } from 'react-thai/phone';
import { BahtText } from 'react-thai/baht-text';

<ThaiIdInput label="เลขประจำตัวประชาชน" onChange={(digits, { valid }) => {}} />
// displays 1-1017-00203-45-0, emits "1101700203450"

<ThaiPhoneInput label="เบอร์มือถือ" type="mobile" output="e164" onChange={(value, meta) => {}} />
// 081-234-5678 → "+66812345678"; 02-123-4567 and 053-123-456 for landlines

<BahtText value={1234.5} /> // หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์
```

| Component        | Key props                                                                                                                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ThaiIdInput`    | `value`/`defaultValue` (digits), `onChange(value, { valid, complete, formatted })`, `name` (hidden digits), `invalidMessage`, `locale`, `label`/`hint`/`error`, input attributes. The check digit is `(11 − Σ dᵢ·(13−i) mod 11) mod 10`. |
| `ThaiPhoneInput` | `value` (national or E.164), `onChange(value, { valid, type, e164, digits, formatted })`, `type: 'any' \| 'mobile' \| 'landline'`, `output: 'national' \| 'e164'`, `name`, `invalidMessage`, `locale`. Pasting `+66 81 234 5678` works.  |
| `BahtText`       | `value: number \| string \| bigint`, `fallback`, span attributes. Follows the เอ็ด/ยี่สิบ/ล้าน/สตางค์/ถ้วน rules, e.g. 101 → หนึ่งร้อยเอ็ด, 1,000,001 → หนึ่งล้านเอ็ด. Pass strings for exact amounts.                                   |

Server-safe helpers from `react-thai/validators`: `isValidThaiId`, `formatThaiId`, `thaiIdCheckDigit`, `isValidThaiPhone`, `formatThaiPhone`, `normalizeThaiPhone`, `getThaiPhoneType`, `toE164`, `isValidThaiPostcode`, `bahtText`, `toThaiDigits`, `toArabicDigits`.

## react-hook-form + zod

All inputs forward refs and take `value`, `onChange`, `onBlur` and `name`, so `{...field}` from `Controller` just works. RHF can focus the first invalid field.

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ThaiAddressInput } from 'react-thai/address';
import { ThaiDatePicker } from 'react-thai/date-picker';
import { ThaiIdInput } from 'react-thai/thai-id';
import { thaiAddressSchema, thaiIdSchema, thaiMobileSchema } from 'react-thai/zod';

const schema = z.object({
  citizenId: thaiIdSchema, // validates the check digit, outputs 13 digits
  phone: thaiMobileSchema, // outputs "0812345678"
  birthday: z.date({ message: 'กรุณาระบุวันเกิด' }),
  address: thaiAddressSchema.nullable().refine((v) => v !== null, 'กรุณาเลือกที่อยู่'),
});

function Form() {
  const { control, handleSubmit } = useForm<
    z.input<typeof schema>,
    unknown,
    z.output<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: { citizenId: '', phone: '', birthday: null as unknown as Date, address: null },
  });
  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Controller
        name="citizenId"
        control={control}
        render={({ field, fieldState }) => (
          <ThaiIdInput label="เลขประจำตัวประชาชน" {...field} error={fieldState.error?.message} />
        )}
      />
      <Controller
        name="birthday"
        control={control}
        render={({ field, fieldState }) => (
          <ThaiDatePicker label="วันเกิด" {...field} error={fieldState.error?.message} />
        )}
      />
      {/* …phone and address the same way */}
    </form>
  );
}
```

`react-thai/zod` exports `thaiIdSchema`, `thaiPhoneSchema`, `thaiMobileSchema`, `thaiPostcodeSchema` and `thaiAddressSchema`. It also exports factories with options: `createThaiIdSchema({ message })`, `createThaiPhoneSchema({ type, output: 'e164', message })` and `createThaiPostcodeSchema({ message })`. They work with zod 3 and 4, and the test suite runs against both.

## Next.js (App Router)

- Interactive entry points ship with `"use client"`, so you can render `<ThaiDatePicker name="birthday" />` straight from a Server Component. Props passed from a Server Component must be serializable. For callbacks (`onChange`, `isDateDisabled`), wrap the component in your own `"use client"` file.
- `react-thai/validators`, `react-thai/zod` and `react-thai/baht-text` have no directive. They run in Server Components, Route Handlers and Server Actions.
- Components are SSR-safe: nothing reads `window` during render, and the calendar only renders after the user opens it.
- Import `react-thai/styles.css` once, for example in `app/layout.tsx`.

[`examples/nextjs`](./examples/nextjs) shows a Server Component page, a client form and a Route Handler. CI builds it from the packed tarball.

## Theming

The default theme is optional. Without it, the components render unstyled markup with stable class names (`rt-*`) and `data-*` state attributes (`data-selected`, `data-today`, `data-disabled`, `data-in-range`, `data-invalid`, …).

```css
/* Override any variable, globally or on a wrapper */
:root {
  --rt-accent: #6d28d9;
  --rt-accent-soft: #ede9fe;
  --rt-accent-soft-fg: #4c1d95;
  --rt-radius: 1rem;
  --rt-font: 'Sarabun', sans-serif;
}
```

Variables: `--rt-bg`, `--rt-surface`, `--rt-fg`, `--rt-muted`, `--rt-border`, `--rt-border-strong`, `--rt-hover`, `--rt-accent`, `--rt-accent-fg`, `--rt-accent-soft`, `--rt-accent-soft-fg`, `--rt-danger`, `--rt-focus`, `--rt-mark-bg`, `--rt-mark-fg`, `--rt-radius`, `--rt-radius-sm`, `--rt-shadow`, `--rt-control-height`, `--rt-day-size`, `--rt-font`, `--rt-font-size`, `--rt-z`.

**Dark mode** follows `prefers-color-scheme`. To force a scheme, set `data-theme="dark"` or `data-theme="light"` on any ancestor.

**Tailwind**: use the `className`/`classNames` slots. The theme lives in a `react-thai` [cascade layer](https://developer.mozilla.org/docs/Web/CSS/@layer), so any unlayered CSS wins. With Tailwind v4, declare the layer first so utilities override it:

```css
@layer react-thai; /* lowest priority */
@import 'tailwindcss';
@import 'react-thai/styles.css';
```

```tsx
<ThaiDatePicker
  label="วันเกิด"
  classNames={{
    input: 'rounded-xl border-slate-300',
    day: 'hover:bg-violet-100',
    popover: 'shadow-2xl',
  }}
/>
```

You can also skip `styles.css` and style everything with Tailwind through the slots and `data-*` attributes (`data-[selected]:bg-violet-600`).

## Address data

|          |                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Source   | [kongvut/thai-province-data](https://github.com/kongvut/thai-province-data) (`api/latest`)                                      |
| License  | MIT, © Kongvut Sangkla (see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md); the notice is also embedded in the data chunks) |
| Version  | tag `v3.1.0` (commit `7d689e4`), generated 2026-10-19                                                                           |
| Coverage | 77 provinces, 930 districts (50 เขต), 7,436 subdistricts (180 แขวง), 966 postcodes, Thai and English names                      |
| Size     | Thai: 58 kB gzip (lazy chunk). English names: 32 kB gzip (separate chunk, only with `includeEnglish`)                           |

`scripts/build-address-data.ts` downloads the pinned tag, validates it (77 provinces, Bangkok prefixes, 5-digit postcodes) and writes a compact format. Province and district names are stored once and referenced by index, rows are sorted by postcode, and postcodes are stored as a run-length index. Run `pnpm data:build --ref <tag>` to update it.

Limitation: the dataset has one postcode per subdistrict. A few large subdistricts actually use more than one postcode, so let users edit the postcode field if you need that precision.

## Accessibility

- The date picker follows the [WAI-ARIA date picker dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/):
  - The calendar opens as a `role="dialog"` with `aria-modal`, and Tab is trapped inside it.
  - The grid uses `role="grid"` with `aria-selected` cells, and every day has a full spoken label ("วันเสาร์ที่ 17 ตุลาคม พ.ศ. 2569").
  - Keys: ←/→/↑/↓ move by day or week, Home/End jump within the week, PageUp/PageDown change the month, Shift+PageUp/PageDown change the year, and Enter/Space select.
  - Esc closes the dialog and returns focus to the input. Alt+↓ opens it from the input.
- The address input follows the [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):
  - Markup: `role="combobox"`, a `listbox` and `aria-activedescendant`.
  - Keys: ↑/↓ wrap through suggestions, Enter selects, Esc closes and then clears.
  - A polite live region announces the result count.
- Labels are linked to inputs. Hints and errors are linked with `aria-describedby`, and errors set `aria-invalid`. All built-in text is in Thai and English and can be overridden.
- CI runs axe on every Storybook story (`@storybook/test-runner` + `axe-playwright`) and fails on any violation.

## Bundle size

Minified and gzipped, with React excluded. CI enforces these budgets with size-limit.

| Import                                         | Size    | Budget |
| ---------------------------------------------- | ------- | ------ |
| `ThaiDatePicker`                               | 7.7 kB  | 12 kB  |
| whole `react-thai/date-picker` (+ range, hook) | 8.0 kB  | 12 kB  |
| `ThaiAddressInput` (code only)                 | 4.6 kB  | 6 kB   |
| `ThaiIdInput`                                  | 1.9 kB  | 3 kB   |
| `ThaiPhoneInput`                               | 2.1 kB  | 3 kB   |
| `BahtText`                                     | 0.9 kB  | 3 kB   |
| address data, Thai (lazy)                      | 58.3 kB | 62 kB  |
| address data, English (lazy, opt-in)           | 32.0 kB | 36 kB  |

There are no runtime dependencies. Popover positioning is a few hundred bytes of built-in code.

## Browser support

- **JavaScript**: ES2020, so all evergreen browsers work.
- **Default theme**: uses `@layer` and `color-mix()`, so it needs Chrome/Edge 111+, Firefox 113+ or Safari 16.2+. Without the theme, the headless components work wherever React 18/19 works.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Bug reports and PRs are welcome.

## License

[MIT](./LICENSE) © Khomkrit Daengnuan. Address data: MIT © Kongvut Sangkla.
