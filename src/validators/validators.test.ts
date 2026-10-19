import { describe, expect, it } from 'vitest';
import {
  formatThaiId,
  formatThaiPhone,
  getThaiPhoneType,
  isValidThaiId,
  isValidThaiPhone,
  isValidThaiPostcode,
  normalizeThaiPhone,
  thaiIdCheckDigit,
  thaiPhoneLength,
  toE164,
} from '.';

/** Independent implementation of the spec, for cross-checking. */
const specCheck = (id: string) => {
  const d = id.split('').map(Number);
  const sum = d.slice(0, 12).reduce((acc, n, i) => acc + n * (13 - i), 0);
  return (11 - (sum % 11)) % 10;
};

describe('Thai ID', () => {
  it('computes the check digit', () => {
    // 1·13 + 1·12 + 0 + 1·10 + 7·9 + 0 + 0 + 2·6 + 0 + 3·4 + 4·3 + 5·2 = 144 → (11 − 1) % 10 = 0
    expect(thaiIdCheckDigit('110170020345')).toBe(0);
    expect(isValidThaiId('1101700203450')).toBe(true);
    expect(isValidThaiId('1101700203451')).toBe(false);
  });

  it('handles the sum % 11 = 0 and = 1 edge cases', () => {
    // Find prefixes whose sum % 11 is 0 (check 1) and 1 (check 0, from 10 % 10).
    const prefixes = ['100000000001', '000000000002'];
    for (const p of prefixes) expect(thaiIdCheckDigit(p)).toBe(specCheck(`${p}0`));
  });

  it('agrees with the spec on many generated IDs', () => {
    let seed = 7;
    for (let n = 0; n < 500; n++) {
      let id = '';
      for (let i = 0; i < 12; i++)
        id += String((seed = (seed * 1103515245 + 12345) % 2 ** 31) % 10);
      const check = specCheck(`${id}0`);
      expect(isValidThaiId(`${id}${check}`)).toBe(true);
      expect(isValidThaiId(`${id}${(check + 1) % 10}`)).toBe(false);
    }
  });

  it('ignores formatting and rejects wrong lengths', () => {
    expect(isValidThaiId('1-1017-00203-45-0')).toBe(true);
    expect(isValidThaiId('๑-๑๐๑๗-๐๐๒๐๓-๔๕-๐')).toBe(true);
    expect(isValidThaiId('110170020345')).toBe(false);
    expect(isValidThaiId('')).toBe(false);
  });

  it('formats progressively', () => {
    expect(formatThaiId('1101700203450')).toBe('1-1017-00203-45-0');
    expect(formatThaiId('11017')).toBe('1-1017');
    expect(formatThaiId('110170')).toBe('1-1017-0');
    expect(formatThaiId('1101700203450999')).toBe('1-1017-00203-45-0');
  });
});

describe('Thai phone', () => {
  it('detects mobile and landline', () => {
    expect(getThaiPhoneType('0812345678')).toBe('mobile');
    expect(getThaiPhoneType('0612345678')).toBe('mobile');
    expect(getThaiPhoneType('0912345678')).toBe('mobile');
    expect(getThaiPhoneType('021234567')).toBe('landline');
    expect(getThaiPhoneType('053123456')).toBe('landline');
    expect(getThaiPhoneType('011234567')).toBeNull();
    expect(getThaiPhoneType('1')).toBeNull();
    expect(thaiPhoneLength('02')).toBe(9);
    expect(thaiPhoneLength('08')).toBe(10);
  });

  it('validates by type and length', () => {
    expect(isValidThaiPhone('081-234-5678')).toBe(true);
    expect(isValidThaiPhone('02-123-4567')).toBe(true);
    expect(isValidThaiPhone('053-123-456')).toBe(true);
    expect(isValidThaiPhone('0812345678', 'landline')).toBe(false);
    expect(isValidThaiPhone('021234567', 'mobile')).toBe(false);
    expect(isValidThaiPhone('021234567', 'landline')).toBe(true);
    expect(isValidThaiPhone('081234567')).toBe(false);
    expect(isValidThaiPhone('02123456789')).toBe(false);
    expect(isValidThaiPhone('0112345678')).toBe(false);
  });

  it('normalises +66 and formats', () => {
    expect(normalizeThaiPhone('+66 81 234 5678')).toBe('0812345678');
    expect(normalizeThaiPhone('66812345678')).toBe('0812345678');
    expect(normalizeThaiPhone('+662-123-4567')).toBe('021234567');
    expect(normalizeThaiPhone('๐๘๑๒๓๔๕๖๗๘')).toBe('0812345678');
    expect(formatThaiPhone('0812345678')).toBe('081-234-5678');
    expect(formatThaiPhone('021234567')).toBe('02-123-4567');
    expect(formatThaiPhone('053123456')).toBe('053-123-456');
    expect(formatThaiPhone('08123')).toBe('081-23');
    expect(formatThaiPhone('+66812345678')).toBe('081-234-5678');
  });

  it('converts to E.164', () => {
    expect(toE164('081-234-5678')).toBe('+66812345678');
    expect(toE164('02-123-4567')).toBe('+6621234567');
    expect(toE164('0812')).toBeNull();
  });
});

describe('postcode', () => {
  it('checks format and province prefix', () => {
    expect(isValidThaiPostcode('10200')).toBe(true);
    expect(isValidThaiPostcode(' 96220 ')).toBe(true);
    expect(isValidThaiPostcode('๕๐๒๐๐')).toBe(true);
    expect(isValidThaiPostcode('09999')).toBe(false);
    expect(isValidThaiPostcode('97000')).toBe(false);
    expect(isValidThaiPostcode('1020')).toBe(false);
    expect(isValidThaiPostcode('10200a')).toBe(false);
  });
});
