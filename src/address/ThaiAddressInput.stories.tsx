import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { useState } from 'react';
import { formatThaiAddress } from './format';
import { ThaiAddressInput } from './ThaiAddressInput';
import type { ThaiAddress } from './types';
import { useThaiAddress } from './useThaiAddress';

const meta = {
  title: 'Components/ThaiAddressInput',
  component: ThaiAddressInput,
  tags: ['autodocs'],
  args: {
    label: 'ที่อยู่',
    hint: 'พิมพ์รหัสไปรษณีย์ ตำบล อำเภอ หรือจังหวัด แล้วเลือกจากรายการ',
    onChange: fn(),
  },
  argTypes: {
    fields: { control: 'inline-radio', options: ['search', 'split'] },
    locale: { control: 'inline-radio', options: ['th', 'en'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560, minHeight: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThaiAddressInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchBox: Story = {};

/** Typing a Bangkok postcode suggests แขวง/เขต; Enter fills the address. */
export const BangkokPostcode: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'ที่อยู่' });
    await userEvent.type(input, '10200');
    const options = await canvas.findAllByRole('option', {}, { timeout: 5000 });
    await expect(options[0]).toHaveTextContent('แขวงพระบรมมหาราชวัง · เขตพระนคร · กรุงเทพมหานคร');
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร 10200');
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ postcode: '10200', isBangkok: true }),
      ),
    );
  },
};

/** Classic four-field layout; any field searches and selecting fills them all. */
export const SplitFields: Story = {
  args: { fields: 'split', label: 'ที่อยู่จัดส่ง', hint: undefined },
};

export const SplitFieldsInteraction: Story = {
  ...SplitFields,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox', { name: 'ตำบล/แขวง' }), 'สุเทพ');
    const options = await canvas.findAllByRole('option', {}, { timeout: 5000 });
    await userEvent.click(options[0]!);
    await expect(canvas.getByRole('combobox', { name: 'อำเภอ/เขต' })).toHaveValue('เมืองเชียงใหม่');
    await expect(canvas.getByRole('combobox', { name: 'จังหวัด' })).toHaveValue('เชียงใหม่');
    await expect(canvas.getByRole('combobox', { name: 'รหัสไปรษณีย์' })).toHaveValue('50200');
  },
};

export const WithEnglishNames: Story = {
  args: {
    locale: 'en',
    label: 'Address',
    hint: 'Search in Thai or English, e.g. "Chiang Mai" or "บางรัก"',
    includeEnglish: true,
  },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [address, setAddress] = useState<ThaiAddress | null>(null);
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <ThaiAddressInput {...args} value={address} onChange={setAddress} />
        <output>{address ? formatThaiAddress(address) : 'ยังไม่ได้เลือก'}</output>
        <pre style={{ fontSize: 12 }}>{JSON.stringify(address, null, 2)}</pre>
      </div>
    );
  },
};

/** `useThaiAddress()` with your own markup: a simple postcode lookup. */
export const HeadlessPostcodeLookup: Story = {
  render: function Render() {
    const { status, lookupPostcode } = useThaiAddress();
    const [postcode, setPostcode] = useState('50200');
    const matches = lookupPostcode(postcode);
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="pc">รหัสไปรษณีย์</label>
        <input
          id="pc"
          className="rt-input"
          inputMode="numeric"
          maxLength={5}
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
        />
        <p>สถานะข้อมูล: {status}</p>
        <ul>
          {matches.map((a) => (
            <li key={a.subdistrict + a.district}>{formatThaiAddress(a)}</li>
          ))}
        </ul>
      </div>
    );
  },
};
