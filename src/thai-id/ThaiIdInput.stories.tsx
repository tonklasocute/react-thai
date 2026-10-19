import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { ThaiIdInput } from './ThaiIdInput';

const meta = {
  title: 'Components/ThaiIdInput',
  component: ThaiIdInput,
  tags: ['autodocs'],
  args: { label: 'เลขประจำตัวประชาชน', hint: '13 หลัก ตามบัตรประชาชน', onChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThaiIdInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Valid: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'เลขประจำตัวประชาชน' });
    await userEvent.type(input, '1101700203450');
    await expect(input).toHaveValue('1-1017-00203-45-0');
    await expect(input).not.toHaveAttribute('aria-invalid');
    await expect(args.onChange).toHaveBeenLastCalledWith(
      '1101700203450',
      expect.objectContaining({ valid: true }),
    );
  },
};

export const InvalidChecksum: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'เลขประจำตัวประชาชน' });
    await userEvent.type(input, '1101700203451');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('เลขประจำตัวประชาชนไม่ถูกต้อง')).toBeVisible();
  },
};

export const English: Story = {
  args: {
    label: 'Thai national ID',
    hint: '13 digits',
    locale: 'en',
    defaultValue: '1101700203451',
  },
};
