import type { Meta, StoryObj } from '@storybook/react';
import { createDate } from '../core/date';
import { ThaiDatePicker } from '../date-picker';
import { ThaiPhoneInput } from '../phone';

function ThemedForm({ theme }: { theme: 'teal' | 'violet' | 'dark' }) {
  const vars =
    theme === 'violet'
      ? ({
          '--rt-accent': '#6d28d9',
          '--rt-focus': '#6d28d9',
          '--rt-accent-soft': '#ede9fe',
          '--rt-accent-soft-fg': '#4c1d95',
          '--rt-radius': '1rem',
        } as React.CSSProperties)
      : undefined;
  return (
    <div
      data-theme={theme === 'dark' ? 'dark' : 'light'}
      style={{
        ...vars,
        padding: 16,
        background: 'var(--rt-bg)',
        color: 'var(--rt-fg)',
        display: 'grid',
        gap: 16,
        maxWidth: 340,
      }}
    >
      <ThaiDatePicker label="วันนัดหมาย" defaultValue={createDate(2026, 9, 17)} />
      <ThaiPhoneInput label="เบอร์โทรศัพท์" defaultValue="0812345678" />
    </div>
  );
}

/**
 * The default theme is a set of `--rt-*` CSS variables in the `react-thai` cascade layer.
 * Override variables on any ancestor, or use `className` / `classNames` with Tailwind.
 */
const meta = {
  title: 'Guides/Theming',
  component: ThemedForm,
  args: { theme: 'violet' },
  argTypes: { theme: { control: 'inline-radio', options: ['teal', 'violet', 'dark'] } },
} satisfies Meta<typeof ThemedForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomVariables: Story = {};
export const Dark: Story = { args: { theme: 'dark' } };
