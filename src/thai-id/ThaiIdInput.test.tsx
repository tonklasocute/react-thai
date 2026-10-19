import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { ThaiIdInput } from './ThaiIdInput';

const setup = (ui: React.ReactElement) => ({ user: userEvent.setup(), ...render(ui) });
const input = () => screen.getByRole('textbox', { name: 'เลขประจำตัวประชาชน' });

describe('ThaiIdInput', () => {
  it('masks while typing and emits digits with metadata', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiIdInput label="เลขประจำตัวประชาชน" onChange={onChange} />);
    expect(input()).toHaveAttribute('placeholder', 'X-XXXX-XXXXX-XX-X');
    expect(input()).toHaveAttribute('inputmode', 'numeric');
    await user.type(input(), '1101700203450');
    expect(input()).toHaveValue('1-1017-00203-45-0');
    expect(onChange).toHaveBeenLastCalledWith('1101700203450', {
      valid: true,
      complete: true,
      formatted: '1-1017-00203-45-0',
    });
    expect(input()).not.toHaveAttribute('aria-invalid');
  });

  it('shows an error for a wrong check digit', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiIdInput label="เลขประจำตัวประชาชน" onChange={onChange} />);
    await user.type(input(), '1101700203451');
    expect(onChange.mock.lastCall![1].valid).toBe(false);
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAccessibleDescription('เลขประจำตัวประชาชนไม่ถูกต้อง');
  });

  it('flags incomplete input on blur, ignores letters and extra digits', async () => {
    const { user } = setup(<ThaiIdInput label="เลขประจำตัวประชาชน" locale="en" />);
    await user.type(input(), '11a017');
    expect(input()).toHaveValue('1-1017');
    expect(input()).not.toHaveAttribute('aria-invalid');
    await user.tab();
    expect(screen.getByText('Invalid Thai ID number')).toBeVisible();
    await user.type(input(), '0020345099');
    expect(input()).toHaveValue('1-1017-00203-45-0');
  });

  it('keeps the caret and removes the digit before a dash on backspace', async () => {
    const { user } = setup(<ThaiIdInput label="เลขประจำตัวประชาชน" />);
    await user.type(input(), '11017');
    expect(input()).toHaveValue('1-1017');
    // Caret right after the dash: backspace removes the digit before it, not the dash.
    await user.type(input(), '{Backspace}', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    expect(input()).toHaveValue('1-017');
    expect(input()).toHaveProperty('selectionStart', 0);
    // Insert in the middle: the caret stays after the typed digit.
    await user.type(input(), '9', { initialSelectionStart: 3, initialSelectionEnd: 3 });
    expect(input()).toHaveValue('1-0917');
    expect(input()).toHaveProperty('selectionStart', 4);
  });

  it('pastes formatted or Thai-digit IDs', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiIdInput label="เลขประจำตัวประชาชน" onChange={onChange} />);
    await user.click(input());
    await user.paste('๑-๑๐๑๗-๐๐๒๐๓-๔๕-๐');
    expect(onChange).toHaveBeenLastCalledWith(
      '1101700203450',
      expect.objectContaining({ valid: true }),
    );
  });

  it('works controlled, with a hidden input, ref and custom messages', async () => {
    const ref = createRef<HTMLInputElement>();
    function Controlled() {
      const [value, setValue] = useState('1101700203450');
      return (
        <form>
          <ThaiIdInput
            ref={ref}
            label="เลขประจำตัวประชาชน"
            name="cid"
            value={value}
            onChange={setValue}
            invalidMessage="เลขไม่ถูกต้อง"
          />
          <button type="button" onClick={() => setValue('')}>
            clear
          </button>
        </form>
      );
    }
    const { user, container } = setup(<Controlled />);
    expect(ref.current).toBe(input());
    expect(input()).toHaveValue('1-1017-00203-45-0');
    expect(new FormData(container.querySelector('form')!).get('cid')).toBe('1101700203450');
    await user.type(input(), '{Backspace}1');
    expect(screen.getByText('เลขไม่ถูกต้อง')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'clear' }));
    expect(input()).toHaveValue('');
  });

  it('works with react-hook-form validation', async () => {
    const onSubmit = vi.fn();
    function Form() {
      const { control, handleSubmit } = useForm({ defaultValues: { cid: '' } });
      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="cid"
            control={control}
            rules={{ validate: (v) => v.length === 13 || 'กรอกให้ครบ 13 หลัก' }}
            render={({ field, fieldState }) => (
              <ThaiIdInput
                label="เลขประจำตัวประชาชน"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />
          <button type="submit">ส่ง</button>
        </form>
      );
    }
    const { user } = setup(<Form />);
    await user.click(screen.getByRole('button', { name: 'ส่ง' }));
    expect(await screen.findByText('กรอกให้ครบ 13 หลัก')).toBeVisible();
    expect(input()).toHaveFocus();
    await user.type(input(), '1101700203450');
    await user.click(screen.getByRole('button', { name: 'ส่ง' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.lastCall![0]).toEqual({ cid: '1101700203450' });
  });
});
