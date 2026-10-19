import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDate, toISODate } from '../core/date';
import { ThaiDateRangePicker } from './ThaiDateRangePicker';
import type { DateRange } from './useThaiCalendar';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 17, 9) });
});
afterEach(() => {
  vi.useRealTimers();
});

const setup = (ui: React.ReactElement) => ({ user: userEvent.setup(), ...render(ui) });
const startInput = () => screen.getByRole('textbox', { name: 'วันเริ่มต้น' });
const endInput = () => screen.getByRole('textbox', { name: 'วันสิ้นสุด' });
const day = (name: RegExp) => screen.getByRole('button', { name });
const isoRange = (fn: ReturnType<typeof vi.fn>) => {
  const r = fn.mock.lastCall?.[0] as DateRange;
  return [r.from && toISODate(r.from), r.to && toISODate(r.to)];
};

describe('ThaiDateRangePicker', () => {
  it('labels the inputs as a group', () => {
    setup(<ThaiDateRangePicker label="ช่วงวันลา" />);
    expect(screen.getByRole('group', { name: 'ช่วงวันลา' })).toBeInTheDocument();
    expect(startInput()).toBeInTheDocument();
    expect(endInput()).toBeInTheDocument();
  });

  it('types both ends in BE', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiDateRangePicker label="ช่วงวันลา" onChange={onChange} />);
    await user.type(startInput(), '01112569');
    await user.type(endInput(), '05112569');
    expect(isoRange(onChange)).toEqual(['2026-11-01', '2026-11-05']);
  });

  it('picks a range in a two-month calendar and previews on hover', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiDateRangePicker label="ช่วงวันลา" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'เลือกวันที่' }));
    expect(screen.getByText('ตุลาคม 2569')).toBeVisible();
    expect(screen.getByText('พฤศจิกายน 2569')).toBeVisible();
    await user.click(day(/^วันอังคารที่ 20 ตุลาคม/));
    expect(isoRange(onChange)).toEqual(['2026-10-20', null]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.hover(day(/^วันพฤหัสบดีที่ 22 ตุลาคม/));
    expect(day(/^วันพุธที่ 21 ตุลาคม/).closest('td')).toHaveAttribute('data-in-range', 'true');
    await user.click(day(/^วันพฤหัสบดีที่ 5 พฤศจิกายน/));
    expect(isoRange(onChange)).toEqual(['2026-10-20', '2026-11-05']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(endInput()).toHaveFocus();
    expect(startInput()).toHaveValue('20/10/2569');
    expect(endInput()).toHaveValue('05/11/2569');
  });

  it('restarts the range when clicking before the start', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ThaiDateRangePicker
        label="ช่วงวันลา"
        defaultValue={{ from: createDate(2026, 9, 20), to: null }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'เลือกวันที่' }));
    await user.click(day(/^วันจันทร์ที่ 12 ตุลาคม/));
    expect(isoRange(onChange)).toEqual(['2026-10-12', null]);
  });

  it('reports an end date before the start date', async () => {
    const { user } = setup(<ThaiDateRangePicker label="ช่วงวันลา" />);
    await user.type(startInput(), '10112569');
    await user.type(endInput(), '01112569');
    expect(endInput()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น')).toBeVisible();
  });

  it('reports invalid text in either input', async () => {
    const { user } = setup(<ThaiDateRangePicker label="ช่วงวันลา" />);
    await user.type(endInput(), '31022569');
    expect(endInput()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('รูปแบบวันที่ไม่ถูกต้อง')).toBeVisible();
  });

  it('writes hidden ISO inputs and forwards the ref to the start input', async () => {
    const ref = createRef<HTMLInputElement>();
    const { container, user } = setup(
      <form>
        <ThaiDateRangePicker ref={ref} label="ช่วงวันลา" startName="from" endName="to" />
      </form>,
    );
    expect(ref.current).toBe(startInput());
    await user.type(startInput(), '01012569');
    const data = new FormData(container.querySelector('form')!);
    expect(data.get('from')).toBe('2026-01-01');
    expect(data.get('to')).toBe('');
  });

  it('closes on Escape and opens with Alt+ArrowDown', async () => {
    const { user } = setup(<ThaiDateRangePicker aria-label="range" />);
    expect(screen.getByRole('group', { name: 'เลือกวันที่' })).toBeInTheDocument();
    await user.click(startInput());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(startInput()).toHaveFocus();
  });

  it('supports controlled values and external errors', () => {
    setup(
      <ThaiDateRangePicker
        label="ช่วงวันลา"
        value={{ from: createDate(2026, 0, 1), to: createDate(2026, 0, 3) }}
        error="เลือกได้ไม่เกิน 2 วัน"
        disabled
      />,
    );
    expect(startInput()).toHaveValue('01/01/2569');
    expect(endInput()).toHaveValue('03/01/2569');
    expect(startInput()).toHaveAttribute('aria-invalid', 'true');
    expect(startInput()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'เลือกวันที่' })).toBeDisabled();
  });
});
