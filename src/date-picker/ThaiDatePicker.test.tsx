import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDate, toISODate } from '../core/date';
import { ThaiDatePicker } from './ThaiDatePicker';

const TODAY = new Date(2026, 9, 17, 10, 30); // Sat 17 Oct 2026 = 17/10/2569

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: TODAY });
});
afterEach(() => {
  vi.useRealTimers();
});

const setup = (ui: React.ReactElement) => ({ user: userEvent.setup(), ...render(ui) });
const input = () => screen.getByRole('textbox', { name: 'วันเกิด' });
const trigger = () => screen.getByRole('button', { name: /เลือกวันที่|เปลี่ยนวันที่/ });
const day = (name: RegExp | string) => screen.getByRole('button', { name });
const iso = (fn: ReturnType<typeof vi.fn>) => {
  const last = fn.mock.lastCall?.[0] as Date | null;
  return last ? toISODate(last) : last;
};

describe('ThaiDatePicker – typing', () => {
  it('shows the value in BE and emits a CE Date', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiDatePicker label="วันเกิด" onChange={onChange} />);
    expect(input()).toHaveAttribute('placeholder', 'วว/ดด/ปปปป');
    await user.type(input(), '17102569');
    expect(input()).toHaveValue('17/10/2569');
    expect(iso(onChange)).toBe('2026-10-17');
    const emitted = onChange.mock.lastCall![0] as Date;
    expect(emitted.getHours()).toBe(0);
  });

  it('accepts Thai digits while typing', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiDatePicker label="วันเกิด" onChange={onChange} />);
    await user.type(input(), '๑๗๑๐๒๕๖๙');
    expect(input()).toHaveValue('17/10/2569');
    expect(iso(onChange)).toBe('2026-10-17');
  });

  it('accepts 29/02 in a BE leap year and rejects it otherwise', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiDatePicker label="วันเกิด" onChange={onChange} />);
    await user.type(input(), '29022567');
    expect(iso(onChange)).toBe('2024-02-29');
    await user.clear(input());
    expect(onChange).toHaveBeenLastCalledWith(null);
    await user.type(input(), '29022569');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('รูปแบบวันที่ไม่ถูกต้อง')).toBeVisible();
  });

  it('flags incomplete input only after blur', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" />);
    await user.type(input(), '1710');
    expect(input()).not.toHaveAttribute('aria-invalid');
    await user.tab();
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAccessibleDescription('รูปแบบวันที่ไม่ถูกต้อง');
  });

  it('emits null for out-of-range and disabled dates and explains why', async () => {
    const onChange = vi.fn();
    const onStatusChange = vi.fn();
    const { user } = setup(
      <ThaiDatePicker
        label="วันเกิด"
        onChange={onChange}
        onStatusChange={onStatusChange}
        minDate={createDate(2026, 0, 1)}
        isDateDisabled={(d) => d.getDay() === 0}
      />,
    );
    await user.type(input(), '01012568');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('วันที่อยู่นอกช่วงที่เลือกได้')).toBeVisible();
    expect(onStatusChange).toHaveBeenLastCalledWith('out-of-range');
    await user.clear(input());
    await user.type(input(), '18102569'); // Sunday
    expect(screen.getByText('ไม่สามารถเลือกวันที่นี้ได้')).toBeVisible();
    expect(onStatusChange).toHaveBeenLastCalledWith('unavailable');
  });

  it('deletes the digit before a separator on backspace', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" />);
    await user.type(input(), '171');
    expect(input()).toHaveValue('17/1');
    await user.type(input(), '{Backspace}{Backspace}');
    expect(input()).toHaveValue('1');
  });

  it('uses CE years when era="CE"', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiDatePicker label="วันเกิด" era="CE" onChange={onChange} />);
    await user.type(input(), '17102026');
    expect(iso(onChange)).toBe('2026-10-17');
  });

  it('renders Thai digits when digits="thai"', () => {
    setup(<ThaiDatePicker label="วันเกิด" digits="thai" defaultValue={createDate(2026, 9, 17)} />);
    expect(input()).toHaveValue('๑๗/๑๐/๒๕๖๙');
  });
});

describe('ThaiDatePicker – calendar dialog', () => {
  it('opens on the selected date and supports the APG keyboard model', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ThaiDatePicker label="วันเกิด" defaultValue={createDate(2026, 9, 17)} onChange={onChange} />,
    );
    await user.click(trigger());
    const dialog = screen.getByRole('dialog', { name: 'เลือกวันที่' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(day('วันเสาร์ที่ 17 ตุลาคม พ.ศ. 2569')).toHaveFocus();
    expect(within(dialog).getByRole('grid', { name: 'ตุลาคม 2569' })).toBeInTheDocument();
    expect(
      within(dialog)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']);

    await user.keyboard('{ArrowLeft}');
    expect(day(/^วันศุกร์ที่ 16 ตุลาคม/)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(day(/^วันศุกร์ที่ 23 ตุลาคม/)).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowRight}');
    expect(day(/^วันเสาร์ที่ 17 ตุลาคม/)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(day(/^วันอาทิตย์ที่ 11 ตุลาคม/)).toHaveFocus();
    await user.keyboard('{End}');
    expect(day(/^วันเสาร์ที่ 17 ตุลาคม/)).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(day(/17 พฤศจิกายน พ.ศ. 2569/)).toHaveFocus();
    expect(screen.getByRole('grid', { name: 'พฤศจิกายน 2569' })).toBeInTheDocument();
    await user.keyboard('{Shift>}{PageUp}{/Shift}');
    expect(day(/17 พฤศจิกายน พ.ศ. 2568/)).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(day(/17 ตุลาคม พ.ศ. 2568/)).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(iso(onChange)).toBe('2025-10-17');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input()).toHaveFocus();
    expect(input()).toHaveValue('17/10/2568');
  });

  it('selects with Space and moves across month boundaries with arrows', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ThaiDatePicker label="วันเกิด" defaultValue={createDate(2026, 9, 31)} onChange={onChange} />,
    );
    await user.click(trigger());
    await user.keyboard('{ArrowRight}');
    expect(day(/ที่ 1 พฤศจิกายน พ.ศ. 2569/)).toHaveFocus();
    await user.keyboard(' ');
    expect(iso(onChange)).toBe('2026-11-01');
  });

  it('closes on Escape and returns focus to the input', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" />);
    await user.click(trigger());
    expect(day(/^วันเสาร์ที่ 17 ตุลาคม/)).toHaveFocus(); // today
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input()).toHaveFocus();
  });

  it('opens with Alt+ArrowDown from the input', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" />);
    await user.click(input());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on outside click without stealing focus', async () => {
    const { user } = setup(
      <>
        <ThaiDatePicker label="วันเกิด" />
        <button type="button">outside</button>
      </>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
  });

  it('traps Tab inside the dialog', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" />);
    await user.click(trigger());
    const focusedDay = day(/^วันเสาร์ที่ 17 ตุลาคม/);
    await user.tab();
    expect(screen.getByRole('button', { name: 'วันนี้' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'เดือนก่อนหน้า' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'วันนี้' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(focusedDay).toHaveFocus();
  });

  it('navigates with buttons and month/year selects showing BE years', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" />);
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'เดือนถัดไป' }));
    expect(screen.getByRole('grid', { name: 'พฤศจิกายน 2569' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'เดือนก่อนหน้า' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'เดือน' }), 'กุมภาพันธ์');
    await user.selectOptions(screen.getByRole('combobox', { name: 'ปี' }), '2567');
    expect(screen.getByRole('grid', { name: 'กุมภาพันธ์ 2567' })).toBeInTheDocument();
    expect(day(/29 กุมภาพันธ์ พ.ศ. 2567/)).toBeInTheDocument();
  });

  it('selects today with the today button', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ThaiDatePicker label="วันเกิด" defaultValue={createDate(2020, 0, 1)} onChange={onChange} />,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'วันนี้' }));
    expect(iso(onChange)).toBe('2026-10-17');
  });

  it('marks disabled and out-of-range days and ignores clicks on them', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ThaiDatePicker
        label="วันเกิด"
        onChange={onChange}
        minDate={createDate(2026, 9, 5)}
        maxDate={createDate(2026, 9, 25)}
        isDateDisabled={(d) => d.getDay() === 0}
      />,
    );
    await user.click(trigger());
    expect(screen.getByRole('button', { name: 'เดือนก่อนหน้า' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'เดือนถัดไป' })).toBeDisabled();
    const before = day(/^วันอาทิตย์ที่ 4 ตุลาคม/);
    expect(before).toHaveAttribute('aria-disabled', 'true');
    await user.click(before);
    await user.click(day(/^วันอาทิตย์ที่ 11 ตุลาคม/));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('option', { name: 'กันยายน' })).toBeDisabled();
    // Keyboard focus is clamped to max.
    await user.keyboard('{PageDown}');
    expect(day(/^วันอาทิตย์ที่ 25 ตุลาคม/)).toHaveFocus();
  });

  it('marks today and the selected day', async () => {
    const { user } = setup(
      <ThaiDatePicker label="วันเกิด" defaultValue={createDate(2026, 9, 2)} />,
    );
    await user.click(trigger());
    expect(day(/^วันเสาร์ที่ 17 ตุลาคม/)).toHaveAttribute('aria-current', 'date');
    expect(day(/^วันศุกร์ที่ 2 ตุลาคม/).closest('td')).toHaveAttribute('aria-selected', 'true');
    expect(trigger()).toHaveAccessibleName('เปลี่ยนวันที่ (วันศุกร์ที่ 2 ตุลาคม พ.ศ. 2569)');
  });

  it('can stay open after selecting', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" closeOnSelect={false} />);
    await user.click(trigger());
    await user.click(day(/^วันศุกร์ที่ 2 ตุลาคม/));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(input()).toHaveValue('02/10/2569');
  });

  it('supports English UI with BE or CE years', async () => {
    const { user } = setup(<ThaiDatePicker label="Birthday" locale="en" era="CE" />);
    expect(screen.getByRole('textbox', { name: 'Birthday' })).toHaveAttribute(
      'placeholder',
      'DD/MM/YYYY',
    );
    await user.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
    expect(day('Saturday, 17 October 2026')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
  });

  it('starts the week on Monday when asked', async () => {
    const { user } = setup(<ThaiDatePicker label="วันเกิด" weekStartsOn={1} />);
    await user.click(trigger());
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('จ');
    await user.keyboard('{Home}');
    expect(day(/^วันจันทร์ที่ 12 ตุลาคม/)).toHaveFocus();
  });

  it('respects controlled open state', async () => {
    const onOpenChange = vi.fn();
    const { user, rerender } = setup(
      <ThaiDatePicker label="วันเกิด" open={false} onOpenChange={onOpenChange} />,
    );
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<ThaiDatePicker label="วันเกิด" open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('ThaiDatePicker – forms', () => {
  it('works controlled and syncs text from the value', async () => {
    function Controlled() {
      const [value, setValue] = useState<Date | null>(createDate(2026, 0, 1));
      return (
        <>
          <ThaiDatePicker label="วันเกิด" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue(createDate(2027, 4, 5))}>
            set
          </button>
          <button type="button" onClick={() => setValue(null)}>
            reset
          </button>
        </>
      );
    }
    const { user } = setup(<Controlled />);
    expect(input()).toHaveValue('01/01/2569');
    await user.click(screen.getByRole('button', { name: 'set' }));
    expect(input()).toHaveValue('05/05/2570');
    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(input()).toHaveValue('');
    // Typing partial text keeps the text even though the value is null.
    await user.type(input(), '0101');
    expect(input()).toHaveValue('01/01');
  });

  it('submits an ISO value through a hidden input', async () => {
    const { container, user } = setup(
      <form>
        <ThaiDatePicker label="วันเกิด" name="birthday" />
      </form>,
    );
    const hidden = container.querySelector<HTMLInputElement>('input[name="birthday"]')!;
    expect(hidden).toHaveValue('');
    await user.type(input(), '29022567');
    expect(hidden.type).toBe('hidden');
    expect(new FormData(container.querySelector('form')!).get('birthday')).toBe('2024-02-29');
    expect(input()).not.toHaveAttribute('name');
  });

  it('forwards the ref to the text input', () => {
    const ref = createRef<HTMLInputElement>();
    setup(<ThaiDatePicker label="วันเกิด" ref={ref} />);
    expect(ref.current).toBe(input());
  });

  it('shows an external error and hint', () => {
    setup(<ThaiDatePicker label="วันเกิด" hint="ใช้ปี พ.ศ." error="กรุณากรอกวันเกิด" />);
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAccessibleDescription('ใช้ปี พ.ศ. กรุณากรอกวันเกิด');
  });

  it('disables the button when disabled or read-only', () => {
    const { rerender } = setup(<ThaiDatePicker label="วันเกิด" disabled />);
    expect(trigger()).toBeDisabled();
    expect(input()).toBeDisabled();
    rerender(<ThaiDatePicker label="วันเกิด" readOnly />);
    expect(trigger()).toBeDisabled();
  });

  it('integrates with react-hook-form Controller', async () => {
    const onSubmit = vi.fn();
    function Form() {
      const { control, handleSubmit } = useForm<{ birthday: Date | null }>({
        defaultValues: { birthday: null },
      });
      return (
        <form onSubmit={handleSubmit((v) => onSubmit(v))}>
          <Controller
            name="birthday"
            control={control}
            rules={{ required: 'กรุณากรอกวันเกิด' }}
            render={({ field, fieldState }) => (
              <ThaiDatePicker label="วันเกิด" {...field} error={fieldState.error?.message} />
            )}
          />
          <button type="submit">ส่ง</button>
        </form>
      );
    }
    const { user } = setup(<Form />);
    await user.click(screen.getByRole('button', { name: 'ส่ง' }));
    expect(await screen.findByText('กรุณากรอกวันเกิด')).toBeVisible();
    expect(input()).toHaveFocus(); // RHF focuses the first invalid field through the ref
    await user.type(input(), '17102569');
    await user.click(screen.getByRole('button', { name: 'ส่ง' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(toISODate(onSubmit.mock.lastCall![0].birthday)).toBe('2026-10-17');
  });
});

describe('ThaiDatePicker – positioning', () => {
  const rect = (top: number, left: number, height: number, width: number) =>
    ({
      top,
      left,
      height,
      width,
      bottom: top + height,
      right: left + width,
      x: left,
      y: top,
    }) as DOMRect;

  it('flips above the input when there is no room below and stays inside the viewport', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      rect(700, 900, 40, 200),
    );
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(360);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300);
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1024,
      configurable: true,
    });
    const { user } = setup(<ThaiDatePicker label="วันเกิด" />);
    await user.click(trigger());
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-side', 'top');
    expect(dialog.style.top).toBe(`${700 - 6 - 360}px`);
    expect(dialog.style.left).toBe(`${1024 - 300 - 8}px`);
  });

  it('honours placement="top-end" when it fits', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      rect(500, 400, 40, 200),
    );
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300);
    const { user } = setup(<ThaiDatePicker label="วันเกิด" placement="top-end" />);
    await user.click(trigger());
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-side', 'top');
    expect(dialog.style.left).toBe(`${600 - 300}px`);
    window.dispatchEvent(new Event('resize'));
    expect(dialog).toHaveAttribute('data-side', 'top');
  });
});
