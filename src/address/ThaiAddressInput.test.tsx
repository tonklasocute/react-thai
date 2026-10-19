import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { ThaiAddressInput } from './ThaiAddressInput';
import type { ThaiAddress } from './types';

const setup = (ui: React.ReactElement) => ({ user: userEvent.setup(), ...render(ui) });
const combo = (name = 'ที่อยู่') => screen.getByRole('combobox', { name });
const lastAddress = (fn: ReturnType<typeof vi.fn>) => fn.mock.lastCall?.[0] as ThaiAddress | null;

describe('ThaiAddressInput – search box', () => {
  it('follows the combobox pattern and fills the address on Enter', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiAddressInput label="ที่อยู่" onChange={onChange} />);
    const input = combo();
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('placeholder', 'พิมพ์ตำบล อำเภอ จังหวัด หรือรหัสไปรษณีย์');

    await user.type(input, 'สุเทพ');
    const listbox = await screen.findByRole('listbox', { name: 'ที่อยู่ที่แนะนำ' });
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    const options = within(listbox).getAllByRole('option');
    expect(options[0]).toHaveTextContent('ตำบลสุเทพ · อำเภอเมืองเชียงใหม่ · เชียงใหม่50200');
    expect(options[0]!.querySelector('mark')).toHaveTextContent('สุเทพ');
    expect(screen.getByRole('status')).toHaveTextContent(`พบ ${options.length} รายการ`);

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');

    expect(lastAddress(onChange)).toMatchObject({
      subdistrict: 'สุเทพ',
      district: 'เมืองเชียงใหม่',
      province: 'เชียงใหม่',
      postcode: '50200',
      isBangkok: false,
    });
    expect(input).toHaveValue('ตำบลสุเทพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('uses แขวง/เขต for Bangkok', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiAddressInput label="ที่อยู่" onChange={onChange} />);
    await user.type(combo(), '10200');
    const option = (await screen.findAllByRole('option'))[0]!;
    expect(option).toHaveTextContent('แขวงพระบรมมหาราชวัง · เขตพระนคร · กรุงเทพมหานคร');
    await user.click(option);
    expect(lastAddress(onChange)).toMatchObject({
      isBangkok: true,
      subdistrictPrefix: 'แขวง',
      districtPrefix: 'เขต',
    });
    expect(combo()).toHaveValue('แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร 10200');
    expect(combo()).toHaveFocus();
  });

  it('wraps arrow navigation and closes with Escape, then clears', async () => {
    const { user } = setup(<ThaiAddressInput label="ที่อยู่" limit={3} />);
    await user.type(combo(), 'เมือง');
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(3);
    await user.keyboard('{ArrowUp}');
    expect(combo()).toHaveAttribute('aria-activedescendant', options[2]!.id);
    await user.keyboard('{ArrowDown}');
    expect(combo()).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(combo()).toHaveValue('เมือง');
    await user.keyboard('{Escape}');
    expect(combo()).toHaveValue('');
    await user.type(combo(), 'สุเทพ');
    await screen.findAllByRole('option');
    await user.tab();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('reopens with ArrowDown and does not submit forms on Enter without a selection', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const { user } = setup(
      <form onSubmit={onSubmit}>
        <ThaiAddressInput label="ที่อยู่" />
      </form>,
    );
    await user.type(combo(), 'สุเทพ');
    await screen.findAllByRole('option');
    await user.keyboard('{Escape}{ArrowDown}');
    expect(await screen.findAllByRole('option')).not.toHaveLength(0);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('announces when nothing matches', async () => {
    const { user } = setup(<ThaiAddressInput label="ที่อยู่" />);
    await user.type(combo(), 'ไม่มีที่อยู่นี้แน่นอน');
    await vi.waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('ไม่พบที่อยู่ที่ตรงกัน'),
    );
    expect(combo()).toHaveAttribute('aria-expanded', 'false');
  });

  it('emits null once the text is edited after a selection', async () => {
    const onChange = vi.fn();
    const { user } = setup(<ThaiAddressInput label="ที่อยู่" onChange={onChange} />);
    await user.type(combo(), '50200');
    await user.click((await screen.findAllByRole('option'))[0]!);
    expect(lastAddress(onChange)).not.toBeNull();
    await user.type(combo(), 'x');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('shows and matches English names with includeEnglish', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ThaiAddressInput aria-label="Address" locale="en" includeEnglish onChange={onChange} />,
    );
    await user.type(combo('Address'), 'phra nakhon');
    const option = (await screen.findAllByRole('option'))[0]!;
    expect(option).toHaveTextContent('Phra Borom Maha Ratchawang, Phra Nakhon, Bangkok');
    expect(option.querySelector('[lang="en"] mark')).toHaveTextContent(/phra nakhon/i);
    await user.click(option);
    expect(lastAddress(onChange)?.en?.province).toBe('Bangkok');
  });
});

describe('ThaiAddressInput – split fields', () => {
  it('fills all four fields from any one of them', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ThaiAddressInput label="ที่อยู่จัดส่ง" fields="split" onChange={onChange} />,
    );
    expect(screen.getByRole('group', { name: 'ที่อยู่จัดส่ง' })).toBeInTheDocument();
    const postcode = screen.getByRole('combobox', { name: 'รหัสไปรษณีย์' });
    expect(postcode).toHaveAttribute('inputmode', 'numeric');
    await user.type(postcode, '50200');
    const options = await screen.findAllByRole('option');
    expect(options[0]!.querySelector('mark')).toHaveTextContent('50200');
    await user.click(options.find((o) => o.textContent?.startsWith('ตำบลสุเทพ'))!);
    expect(screen.getByRole('combobox', { name: 'ตำบล/แขวง' })).toHaveValue('สุเทพ');
    expect(screen.getByRole('combobox', { name: 'อำเภอ/เขต' })).toHaveValue('เมืองเชียงใหม่');
    expect(screen.getByRole('combobox', { name: 'จังหวัด' })).toHaveValue('เชียงใหม่');
    expect(postcode).toHaveValue('50200');
    expect(lastAddress(onChange)?.subdistrict).toBe('สุเทพ');
  });

  it('only searches the field being typed in and relabels for Bangkok', async () => {
    const { user } = setup(<ThaiAddressInput label="ที่อยู่" fields="split" />);
    await user.type(screen.getByRole('combobox', { name: 'อำเภอ/เขต' }), 'บางรัก');
    const options = await screen.findAllByRole('option');
    for (const o of options) expect(o.textContent).toMatch(/(อำเภอ|เขต)[^·]*บางรัก/);
    await user.click(options.find((o) => o.textContent?.startsWith('แขวงสีลม'))!);
    expect(screen.getByRole('combobox', { name: 'แขวง' })).toHaveValue('สีลม');
    expect(screen.getByRole('combobox', { name: 'เขต' })).toHaveValue('บางรัก');
    expect(screen.getByRole('combobox', { name: 'จังหวัด' })).toHaveValue('กรุงเทพมหานคร');
  });

  it('writes hidden inputs for native forms', async () => {
    const { container, user } = setup(
      <form>
        <ThaiAddressInput label="ที่อยู่" fields="split" name="address" />
      </form>,
    );
    await user.type(screen.getByRole('combobox', { name: 'ตำบล/แขวง' }), 'สุเทพ');
    await user.keyboard('{ArrowDown}');
    await screen.findAllByRole('option');
    await user.keyboard('{ArrowDown}{Enter}');
    const data = Object.fromEntries(new FormData(container.querySelector('form')!));
    expect(data).toEqual({
      'address.subdistrict': 'สุเทพ',
      'address.district': 'เมืองเชียงใหม่',
      'address.province': 'เชียงใหม่',
      'address.postcode': '50200',
    });
  });
});

describe('ThaiAddressInput – forms', () => {
  const bangrak: ThaiAddress = {
    subdistrict: 'บางรัก',
    district: 'บางรัก',
    province: 'กรุงเทพมหานคร',
    postcode: '10500',
    isBangkok: true,
    subdistrictPrefix: 'แขวง',
    districtPrefix: 'เขต',
  };

  it('syncs text from a controlled value', async () => {
    function Controlled() {
      const [value, setValue] = useState<ThaiAddress | null>(null);
      return (
        <>
          <ThaiAddressInput label="ที่อยู่" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue(bangrak)}>
            set
          </button>
          <button type="button" onClick={() => setValue(null)}>
            reset
          </button>
        </>
      );
    }
    const { user } = setup(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'set' }));
    expect(combo()).toHaveValue('แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500');
    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(combo()).toHaveValue('');
    await user.type(combo(), 'บาง');
    expect(combo()).toHaveValue('บาง');
  });

  it('forwards the ref, shows errors and works with react-hook-form', async () => {
    const ref = createRef<HTMLInputElement>();
    const { unmount } = setup(
      <ThaiAddressInput ref={ref} label="ที่อยู่" error="จำเป็น" hint="ค้นหาได้" />,
    );
    expect(ref.current).toBe(combo());
    expect(combo()).toHaveAttribute('aria-invalid', 'true');
    expect(combo()).toHaveAccessibleDescription('ค้นหาได้ จำเป็น');
    unmount();

    const onSubmit = vi.fn();
    function Form() {
      const { control, handleSubmit } = useForm<{ address: ThaiAddress | null }>({
        defaultValues: { address: null },
      });
      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="address"
            control={control}
            rules={{ required: 'กรุณาเลือกที่อยู่' }}
            render={({ field, fieldState }) => (
              <ThaiAddressInput label="ที่อยู่" {...field} error={fieldState.error?.message} />
            )}
          />
          <button type="submit">ส่ง</button>
        </form>
      );
    }
    const { user } = setup(<Form />);
    await user.click(screen.getByRole('button', { name: 'ส่ง' }));
    expect(await screen.findByText('กรุณาเลือกที่อยู่')).toBeVisible();
    expect(combo()).toHaveFocus();
    await user.type(combo(), '10500');
    await user.click((await screen.findAllByRole('option'))[0]!);
    await user.click(screen.getByRole('button', { name: 'ส่ง' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.lastCall![0].address.postcode).toBe('10500');
  });

  it('can be disabled', () => {
    setup(<ThaiAddressInput label="ที่อยู่" disabled />);
    expect(combo()).toBeDisabled();
  });
});
