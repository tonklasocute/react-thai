import { zodResolver } from '@hookform/resolvers/zod';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ThaiAddressInput } from '../address';
import { BahtText } from '../baht-text';
import { ThaiDatePicker, toISODate } from '../date-picker';
import { ThaiPhoneInput } from '../phone';
import { ThaiIdInput } from '../thai-id';
import { thaiAddressSchema, thaiIdSchema, thaiMobileSchema } from '../zod';

const schema = z.object({
  fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  citizenId: thaiIdSchema,
  phone: thaiMobileSchema,
  birthday: z.date({ message: 'กรุณาระบุวันเกิด' }),
  address: thaiAddressSchema.nullable().refine((v) => v !== null, 'กรุณาเลือกที่อยู่'),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function RegistrationForm() {
  const [submitted, setSubmitted] = useState<FormOutput | null>(null);
  const { control, register, handleSubmit, formState } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      citizenId: '',
      phone: '',
      birthday: null as unknown as Date,
      address: null,
    },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(setSubmitted)}
      style={{ display: 'grid', gap: 16, maxWidth: 560 }}
    >
      <div className="rt-field">
        <label className="rt-label" htmlFor="fullName">
          ชื่อ-นามสกุล
        </label>
        <input
          id="fullName"
          className="rt-input"
          aria-invalid={!!formState.errors.fullName}
          aria-describedby="fullName-error"
          {...register('fullName')}
        />
        <p id="fullName-error" className="rt-error" hidden={!formState.errors.fullName}>
          {formState.errors.fullName?.message}
        </p>
      </div>
      <Controller
        name="citizenId"
        control={control}
        render={({ field, fieldState }) => (
          <ThaiIdInput label="เลขประจำตัวประชาชน" {...field} error={fieldState.error?.message} />
        )}
      />
      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <ThaiPhoneInput
            label="เบอร์มือถือ"
            type="mobile"
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="birthday"
        control={control}
        render={({ field, fieldState }) => (
          <ThaiDatePicker
            label="วันเกิด"
            maxDate={new Date()}
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="address"
        control={control}
        render={({ field, fieldState }) => (
          <ThaiAddressInput label="ที่อยู่" {...field} error={fieldState.error?.message} />
        )}
      />
      <p>
        ค่าธรรมเนียม 1,250.50 บาท (<BahtText value={1250.5} />)
      </p>
      <button type="submit" style={{ justifySelf: 'start', padding: '8px 16px' }}>
        ลงทะเบียน
      </button>
      {submitted && (
        <pre aria-label="ผลลัพธ์" style={{ fontSize: 12 }}>
          {/* Send dates as YYYY-MM-DD: JSON.stringify(Date) converts to UTC and can shift the day. */}
          {JSON.stringify({ ...submitted, birthday: toISODate(submitted.birthday) }, null, 2)}
        </pre>
      )}
    </form>
  );
}

const meta = {
  title: 'Examples/React Hook Form + Zod',
  component: RegistrationForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RegistrationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Registration: Story = {};

export const SubmitFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'ลงทะเบียน' }));
    await expect(await canvas.findByText('กรุณาระบุวันเกิด')).toBeVisible();
    await expect(canvas.getByText('กรุณาเลือกที่อยู่')).toBeVisible();

    await userEvent.type(canvas.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี');
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'เลขประจำตัวประชาชน' }),
      '1101700203450',
    );
    await userEvent.type(canvas.getByRole('textbox', { name: 'เบอร์มือถือ' }), '0812345678');
    await userEvent.type(canvas.getByRole('textbox', { name: 'วันเกิด' }), '17102540');
    await userEvent.type(canvas.getByRole('combobox', { name: 'ที่อยู่' }), '50200');
    const options = await canvas.findAllByRole('option', {}, { timeout: 5000 });
    await userEvent.click(options[0]!);
    await userEvent.click(canvas.getByRole('button', { name: 'ลงทะเบียน' }));
    await waitFor(() =>
      expect(canvas.getByLabelText('ผลลัพธ์')).toHaveTextContent('"citizenId": "1101700203450"'),
    );
    await expect(canvas.getByLabelText('ผลลัพธ์')).toHaveTextContent('"birthday": "1997-10-17"');
  },
};
