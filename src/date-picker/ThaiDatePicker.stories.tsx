import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { useState } from 'react';
import { createDate, toISODate } from '../core/date';
import { ThaiDatePicker } from './ThaiDatePicker';
import { ThaiDateRangePicker } from './ThaiDateRangePicker';
import { useThaiCalendar } from './useThaiCalendar';

const meta = {
  title: 'Components/ThaiDatePicker',
  component: ThaiDatePicker,
  tags: ['autodocs'],
  args: {
    label: 'วันเกิด',
    hint: 'พิมพ์เป็น วว/ดด/ปปปป (พ.ศ.) หรือเลือกจากปฏิทิน',
    onChange: fn(),
    locale: 'th',
    era: 'BE',
  },
  argTypes: {
    locale: { control: 'inline-radio', options: ['th', 'en'] },
    era: { control: 'inline-radio', options: ['BE', 'CE'] },
    digits: { control: 'inline-radio', options: ['arabic', 'thai'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThaiDatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: createDate(2026, 9, 17) },
};

/** Typing `17102569` produces `17/10/2569` and emits `Date(2026-10-17)`. */
export const TypeABuddhistDate: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'วันเกิด' });
    await userEvent.type(input, '29022567');
    await expect(input).toHaveValue('29/02/2567');
    const emitted = (args.onChange as ReturnType<typeof fn>).mock.lastCall?.[0] as Date;
    await expect(toISODate(emitted)).toBe('2024-02-29');
  },
};

/** Opens the dialog, moves with the keyboard and selects with Enter. */
export const KeyboardNavigation: Story = {
  args: { defaultValue: createDate(2026, 9, 17) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /เปลี่ยนวันที่/ }));
    const dialog = await canvas.findByRole('dialog', { name: 'เลือกวันที่' });
    await expect(within(dialog).getByRole('button', { name: /17 ตุลาคม พ.ศ. 2569/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');
    await expect(within(dialog).getByRole('button', { name: /25 ตุลาคม พ.ศ. 2569/ })).toHaveFocus();
    await userEvent.keyboard('{PageDown}');
    await expect(
      within(dialog).getByRole('button', { name: /25 พฤศจิกายน พ.ศ. 2569/ }),
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('textbox', { name: 'วันเกิด' })).toHaveValue('25/11/2569');
    await expect(canvas.getByRole('textbox', { name: 'วันเกิด' })).toHaveFocus();
  },
};

export const InvalidDate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'วันเกิด' });
    await userEvent.type(input, '29022569');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('รูปแบบวันที่ไม่ถูกต้อง')).toBeVisible();
  },
};

export const EnglishUI: Story = {
  args: { locale: 'en', label: 'Date of birth', hint: 'DD/MM/YYYY in Buddhist Era' },
};

export const CommonEra: Story = {
  args: { era: 'CE', label: 'วันที่ (ค.ศ.)', hint: undefined },
};

export const ThaiDigits: Story = {
  args: { digits: 'thai', defaultValue: createDate(2026, 9, 17), defaultOpen: true },
};

/** Weekends disabled, bookable only within the next 60 days. */
export const MinMaxAndDisabledDays: Story = {
  render: (args) => {
    const today = new Date();
    return (
      <ThaiDatePicker
        {...args}
        label="วันนัดหมาย"
        hint="จันทร์–ศุกร์ ภายใน 60 วัน"
        minDate={today}
        maxDate={createDate(today.getFullYear(), today.getMonth(), today.getDate() + 60)}
        isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
      />
    );
  },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<Date | null>(createDate(2026, 0, 1));
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <ThaiDatePicker {...args} value={value} onChange={setValue} />
        <output>value: {value ? toISODate(value) : 'null'}</output>
        <button type="button" onClick={() => setValue(null)}>
          ล้างค่า
        </button>
      </div>
    );
  },
};

export const Range: StoryObj<typeof ThaiDateRangePicker> = {
  render: (args) => <ThaiDateRangePicker {...args} />,
  args: { label: 'ช่วงวันลา', hint: 'เลือกวันเริ่มต้นและวันสิ้นสุด', onChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export const RangeInteraction: StoryObj<typeof ThaiDateRangePicker> = {
  ...Range,
  args: {
    ...Range.args,
    defaultValue: { from: createDate(2026, 9, 20), to: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'เลือกวันที่' }));
    const dialog = await canvas.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: /ที่ 5 พฤศจิกายน พ.ศ. 2569/ }),
    );
    await expect(canvas.getByRole('textbox', { name: 'วันสิ้นสุด' })).toHaveValue('05/11/2569');
  },
};

/** `useThaiCalendar` drives any markup — here a compact custom calendar. */
export const HeadlessHook: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<Date | null>(null);
    const cal = useThaiCalendar({ selected, onSelect: setSelected });
    const month = cal.months[0]!;
    return (
      <div style={{ width: 280, fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <button type="button" onClick={cal.prevMonth} aria-label={cal.labels.prevMonth}>
            ‹
          </button>
          <strong id="headless-label">{month.label}</strong>
          <button type="button" onClick={cal.nextMonth} aria-label={cal.labels.nextMonth}>
            ›
          </button>
        </div>
        <div {...cal.getGridProps()}>
          <table role="grid" aria-labelledby="headless-label" style={{ width: '100%' }}>
            <thead>
              <tr>
                {cal.weekdays.map((w) => (
                  <th key={w.long} abbr={w.long} scope="col">
                    {w.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {month.weeks.map((week, i) => (
                <tr key={i}>
                  {week.map((day, j) => (
                    <td key={j} role="gridcell" aria-selected={day?.isSelected ?? undefined}>
                      {day && (
                        <button
                          {...cal.getDayProps(day)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            border: 0,
                            background: day.isSelected ? '#7c3aed' : 'transparent',
                            color: day.isSelected ? '#fff' : 'inherit',
                          }}
                        >
                          {day.label}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>เลือก: {selected ? toISODate(selected) : '—'}</p>
      </div>
    );
  },
};
