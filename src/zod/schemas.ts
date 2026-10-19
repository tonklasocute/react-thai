import { z } from 'zod';
import { onlyDigits } from '../core/digits';
import {
  normalizeThaiPhone,
  isValidThaiPhone,
  type ThaiPhoneType,
  toE164,
} from '../validators/phone';
import { isValidThaiPostcode } from '../validators/postcode';
import { isValidThaiId } from '../validators/thaiId';

export interface ThaiIdSchemaOptions {
  message?: string;
}

/** Thai national ID: accepts dashes/spaces/Thai digits, validates the check digit, outputs 13 digits. */
export const createThaiIdSchema = ({
  message = 'เลขประจำตัวประชาชนไม่ถูกต้อง',
}: ThaiIdSchemaOptions = {}) =>
  z
    .string()
    .refine(isValidThaiId, { message })
    .transform((value) => onlyDigits(value));

export interface ThaiPhoneSchemaOptions {
  /** Restrict to mobile or landline. Default `any`. */
  type?: ThaiPhoneType | 'any';
  /** Parsed output: national digits (`0812345678`, default) or E.164 (`+66812345678`). */
  output?: 'national' | 'e164';
  message?: string;
}

/** Thai phone number: accepts `081-234-5678`, `+66 81 234 5678`, …; outputs normalised digits. */
export const createThaiPhoneSchema = ({
  type = 'any',
  output = 'national',
  message = 'เบอร์โทรศัพท์ไม่ถูกต้อง',
}: ThaiPhoneSchemaOptions = {}) =>
  z
    .string()
    .refine((value) => isValidThaiPhone(value, type), { message })
    .transform((value) =>
      output === 'e164' ? (toE164(value) as string) : normalizeThaiPhone(value),
    );

export interface ThaiPostcodeSchemaOptions {
  message?: string;
}

/** Five-digit Thai postcode with a valid province prefix (format check only). */
export const createThaiPostcodeSchema = ({
  message = 'รหัสไปรษณีย์ไม่ถูกต้อง',
}: ThaiPostcodeSchemaOptions = {}) =>
  z
    .string()
    .refine(isValidThaiPostcode, { message })
    .transform((value) => onlyDigits(value));

export const thaiIdSchema = createThaiIdSchema();
export const thaiPhoneSchema = createThaiPhoneSchema();
export const thaiMobileSchema = createThaiPhoneSchema({ type: 'mobile' });
export const thaiPostcodeSchema = createThaiPostcodeSchema();

/** Shape of the value emitted by `<ThaiAddressInput>`. */
export const thaiAddressSchema = z.object({
  subdistrict: z.string().min(1),
  district: z.string().min(1),
  province: z.string().min(1),
  postcode: thaiPostcodeSchema,
  isBangkok: z.boolean(),
  subdistrictPrefix: z.enum(['แขวง', 'ตำบล']),
  districtPrefix: z.enum(['เขต', 'อำเภอ']),
  en: z.object({ subdistrict: z.string(), district: z.string(), province: z.string() }).optional(),
});
