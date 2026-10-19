// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  BahtText,
  ThaiAddressInput,
  ThaiDatePicker,
  ThaiDateRangePicker,
  ThaiIdInput,
  ThaiPhoneInput,
} from '.';
import { createDate } from './core/date';

describe('server rendering (no window/document)', () => {
  it('has no DOM globals in this environment', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('renders every component to HTML', () => {
    const html = renderToString(
      <>
        <ThaiDatePicker label="วันเกิด" name="birthday" defaultValue={createDate(2026, 9, 17)} />
        <ThaiDateRangePicker label="ช่วงวัน" />
        <ThaiAddressInput label="ที่อยู่" fields="split" />
        <ThaiAddressInput label="ค้นหาที่อยู่" />
        <ThaiIdInput label="บัตรประชาชน" defaultValue="1101700203450" />
        <ThaiPhoneInput label="โทรศัพท์" defaultValue="0812345678" />
        <BahtText value={21} />
      </>,
    );
    expect(html).toContain('value="17/10/2569"');
    expect(html).toContain('value="2026-10-17"');
    expect(html).toContain('ตำบล/แขวง');
    expect(html).toContain('value="1-1017-00203-45-0"');
    expect(html).toContain('value="081-234-5678"');
    expect(html).toContain('ยี่สิบเอ็ดบาทถ้วน');
  });

  it('renders an initially open calendar on the server', () => {
    const html = renderToString(
      <ThaiDatePicker label="วันเกิด" defaultOpen defaultValue={createDate(2026, 9, 17)} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('ตุลาคม 2569');
  });
});
