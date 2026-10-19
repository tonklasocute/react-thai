import { describe, expect, it } from 'vitest';
import { bahtText } from './words';

describe('bahtText', () => {
  it.each([
    [0, 'ศูนย์บาทถ้วน'],
    [1, 'หนึ่งบาทถ้วน'],
    [10, 'สิบบาทถ้วน'],
    [11, 'สิบเอ็ดบาทถ้วน'],
    [20, 'ยี่สิบบาทถ้วน'],
    [21, 'ยี่สิบเอ็ดบาทถ้วน'],
    [101, 'หนึ่งร้อยเอ็ดบาทถ้วน'],
    [111, 'หนึ่งร้อยสิบเอ็ดบาทถ้วน'],
    [120, 'หนึ่งร้อยยี่สิบบาทถ้วน'],
    [1001, 'หนึ่งพันเอ็ดบาทถ้วน'],
    [100000, 'หนึ่งแสนบาทถ้วน'],
    [1000000, 'หนึ่งล้านบาทถ้วน'],
    [1000001, 'หนึ่งล้านเอ็ดบาทถ้วน'],
    [2500000, 'สองล้านห้าแสนบาทถ้วน'],
    [11000000, 'สิบเอ็ดล้านบาทถ้วน'],
    [21000021, 'ยี่สิบเอ็ดล้านยี่สิบเอ็ดบาทถ้วน'],
    [101000000, 'หนึ่งร้อยเอ็ดล้านบาทถ้วน'],
    [1e12, 'หนึ่งล้านล้านบาทถ้วน'],
  ])('%d → %s', (value, text) => {
    expect(bahtText(value)).toBe(text);
  });

  it('reads satang', () => {
    expect(bahtText(1234.5)).toBe('หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์');
    expect(bahtText(0.25)).toBe('ยี่สิบห้าสตางค์');
    expect(bahtText(0.01)).toBe('หนึ่งสตางค์');
    expect(bahtText(1.01)).toBe('หนึ่งบาทหนึ่งสตางค์');
    expect(bahtText(10.21)).toBe('สิบบาทยี่สิบเอ็ดสตางค์');
    expect(bahtText(0.11)).toBe('สิบเอ็ดสตางค์');
  });

  it('rounds half-up to satang without float errors when given strings', () => {
    expect(bahtText('12.345')).toBe('สิบสองบาทสามสิบห้าสตางค์');
    expect(bahtText('0.995')).toBe('หนึ่งบาทถ้วน');
    expect(bahtText('0.004')).toBe('ศูนย์บาทถ้วน');
    expect(bahtText('-0.001')).toBe('ศูนย์บาทถ้วน');
  });

  it('handles negatives, bigints, large strings and formatted input', () => {
    expect(bahtText(-5)).toBe('ลบห้าบาทถ้วน');
    expect(bahtText(2n)).toBe('สองบาทถ้วน');
    expect(bahtText('1,000,000,000,000,000,001')).toBe('หนึ่งล้านล้านล้านเอ็ดบาทถ้วน');
    expect(bahtText('฿1,234 บาท')).toBe('หนึ่งพันสองร้อยสามสิบสี่บาทถ้วน');
    expect(bahtText('.5')).toBe('ห้าสิบสตางค์');
  });

  it('rejects invalid amounts', () => {
    expect(() => bahtText(Number.NaN)).toThrow(RangeError);
    expect(() => bahtText(Infinity)).toThrow(RangeError);
    expect(() => bahtText(1e21)).toThrow(RangeError);
    expect(() => bahtText('abc')).toThrow(RangeError);
    expect(() => bahtText('')).toThrow(RangeError);
    expect(() => bahtText('1.2.3')).toThrow(RangeError);
  });
});
