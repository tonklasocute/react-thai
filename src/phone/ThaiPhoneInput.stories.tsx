import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { ThaiPhoneInput } from './ThaiPhoneInput';

const meta = {
  title: 'Components/ThaiPhoneInput',
  component: ThaiPhoneInput,
  tags: ['autodocs'],
  args: { label: 'เบอร์โทรศัพท์', onChange: fn() },
  argTypes: {
    type: { control: 'inline-radio', options: ['any', 'mobile', 'landline'] },
    output: { control: 'inline-radio', options: ['national', 'e164'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThaiPhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { hint: 'มือถือ 0XX-XXX-XXXX หรือบ้าน 02-XXX-XXXX' } };

export const MobileToE164: Story = {
  args: { type: 'mobile', output: 'e164', hint: 'ส่งค่าเป็น +66…' },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'เบอร์โทรศัพท์' });
    await userEvent.type(input, '0812345678');
    await expect(input).toHaveValue('081-234-5678');
    await expect(args.onChange).toHaveBeenLastCalledWith('+66812345678', expect.anything());
  },
};

export const BangkokLandline: Story = {
  args: { type: 'landline', defaultValue: '021234567' },
};

export const WrongType: Story = {
  args: { type: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'เบอร์โทรศัพท์' }), '021234567');
    await expect(canvas.getByText('เบอร์โทรศัพท์ไม่ถูกต้อง')).toBeVisible();
  },
};
