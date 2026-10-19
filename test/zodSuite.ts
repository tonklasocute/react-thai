/** Shared assertions for react-thai/zod, run against zod v4 and v3. */
import { expect, it } from 'vitest';
import {
  createThaiIdSchema,
  createThaiPhoneSchema,
  thaiAddressSchema,
  thaiIdSchema,
  thaiMobileSchema,
  thaiPhoneSchema,
  thaiPostcodeSchema,
} from '../src/zod';

export function runSchemaSuite() {
  it('thaiIdSchema validates the check digit and strips formatting', () => {
    expect(thaiIdSchema.parse('1-1017-00203-45-0')).toBe('1101700203450');
    const result = thaiIdSchema.safeParse('1101700203451');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('เลขประจำตัวประชาชนไม่ถูกต้อง');
    expect(createThaiIdSchema({ message: 'bad id' }).safeParse('1').error?.issues[0]?.message).toBe(
      'bad id',
    );
  });

  it('thaiPhoneSchema normalises and can output E.164', () => {
    expect(thaiPhoneSchema.parse('+66 81 234 5678')).toBe('0812345678');
    expect(thaiPhoneSchema.parse('02-123-4567')).toBe('021234567');
    expect(thaiMobileSchema.safeParse('02-123-4567').success).toBe(false);
    expect(createThaiPhoneSchema({ output: 'e164' }).parse('081-234-5678')).toBe('+66812345678');
    expect(thaiPhoneSchema.safeParse('0812').error?.issues[0]?.message).toBe(
      'เบอร์โทรศัพท์ไม่ถูกต้อง',
    );
  });

  it('thaiPostcodeSchema checks the format', () => {
    expect(thaiPostcodeSchema.parse('๕๐๒๐๐')).toBe('50200');
    expect(thaiPostcodeSchema.safeParse('00000').success).toBe(false);
  });

  it('thaiAddressSchema matches the component value', () => {
    const address = {
      subdistrict: 'บางรัก',
      district: 'บางรัก',
      province: 'กรุงเทพมหานคร',
      postcode: '10500',
      isBangkok: true,
      subdistrictPrefix: 'แขวง',
      districtPrefix: 'เขต',
    };
    expect(thaiAddressSchema.parse(address)).toEqual(address);
    expect(thaiAddressSchema.safeParse({ ...address, postcode: '1' }).success).toBe(false);
  });
}
