import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ThaiPhoneInput } from './ThaiPhoneInput';

const setup = (ui: React.ReactElement) => ({ user: userEvent.setup(), ...render(ui) });
const input = () => screen.getByRole('textbox', { name: 'เบอร์โทรศัพท์' });

describe('ThaiPhoneInput', () => {
  it('masks a mobile number and reports metadata', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiPhoneInput label="เบอร์โทรศัพท์" onChange={onChange} />);
    expect(input()).toHaveAttribute('type', 'tel');
    expect(input()).toHaveAttribute('autocomplete', 'tel-national');
    await user.type(input(), '0812345678');
    expect(input()).toHaveValue('081-234-5678');
    expect(onChange).toHaveBeenLastCalledWith('0812345678', {
      valid: true,
      type: 'mobile',
      e164: '+66812345678',
      digits: '0812345678',
      formatted: '081-234-5678',
    });
  });

  it('masks Bangkok and provincial landlines', async () => {
    const { user } = setup(<ThaiPhoneInput label="เบอร์โทรศัพท์" />);
    await user.type(input(), '0212345678');
    expect(input()).toHaveValue('02-123-4567');
    await user.clear(input());
    await user.type(input(), '0531234567');
    expect(input()).toHaveValue('053-123-456');
  });

  it('outputs E.164 when asked, and accepts E.164 values', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <form>
        <ThaiPhoneInput label="เบอร์โทรศัพท์" output="e164" name="tel" onChange={onChange} />
      </form>,
    );
    await user.type(input(), '0812345');
    expect(onChange).toHaveBeenLastCalledWith('0812345', expect.objectContaining({ valid: false }));
    await user.type(input(), '678');
    expect(onChange).toHaveBeenLastCalledWith('+66812345678', expect.anything());
    expect(new FormData(container.querySelector('form')!).get('tel')).toBe('+66812345678');
  });

  it('normalises pasted +66 numbers', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiPhoneInput label="เบอร์โทรศัพท์" onChange={onChange} />);
    await user.click(input());
    await user.paste('+66 81 234 5678');
    expect(input()).toHaveValue('081-234-5678');
    expect(onChange).toHaveBeenLastCalledWith(
      '0812345678',
      expect.objectContaining({ valid: true }),
    );
  });

  it('rejects the wrong type and incomplete numbers', async () => {
    const { user, rerender } = setup(<ThaiPhoneInput label="เบอร์โทรศัพท์" type="mobile" />);
    expect(input()).toHaveAttribute('placeholder', '0XX-XXX-XXXX');
    await user.type(input(), '021234567');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('เบอร์โทรศัพท์ไม่ถูกต้อง')).toBeVisible();
    rerender(<ThaiPhoneInput label="เบอร์โทรศัพท์" type="landline" locale="en" />);
    expect(input()).toHaveAttribute('placeholder', '0X-XXX-XXXX');
    expect(input()).not.toHaveAttribute('aria-invalid');
    await user.clear(input());
    await user.type(input(), '0812');
    await user.tab();
    expect(screen.getByText('Invalid phone number')).toBeVisible();
  });

  it('displays a controlled E.164 value and forwards the ref', () => {
    const ref = createRef<HTMLInputElement>();
    setup(
      <ThaiPhoneInput ref={ref} label="เบอร์โทรศัพท์" value="+6621234567" onChange={() => {}} />,
    );
    expect(input()).toHaveValue('02-123-4567');
    expect(ref.current).toBe(input());
  });

  it('prefers an external error message', () => {
    setup(<ThaiPhoneInput label="เบอร์โทรศัพท์" error="จำเป็นต้องกรอก" />);
    expect(input()).toHaveAccessibleDescription('จำเป็นต้องกรอก');
  });
});
