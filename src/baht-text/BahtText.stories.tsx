import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { BahtText } from './BahtText';

const meta = {
  title: 'Components/BahtText',
  component: BahtText,
  tags: ['autodocs'],
  args: { value: 1234.5 },
  argTypes: { value: { control: 'text' } },
} satisfies Meta<typeof BahtText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์'),
    ).toBeVisible();
  },
};

export const Examples: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {[0, 21, 101, 1_000_001, 25_000_000.75, '1,000,000,000,000.01', -42].map((v) => (
          <tr key={String(v)}>
            <th scope="row" style={{ textAlign: 'right', padding: '4px 12px', fontWeight: 400 }}>
              {String(v)}
            </th>
            <td style={{ padding: '4px 12px' }}>
              <BahtText value={v} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
