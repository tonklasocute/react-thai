import { describe, expect, it } from 'vitest';
import { onlyDigits, toArabicDigits, toThaiDigits, withDigits } from './digits';

describe('digits', () => {
  it('converts both ways', () => {
    expect(toThaiDigits('17/10/2569')).toBe('๑๗/๑๐/๒๕๖๙');
    expect(toThaiDigits(1234567890)).toBe('๑๒๓๔๕๖๗๘๙๐');
    expect(toArabicDigits('๑๗/๑๐/๒๕๖๙')).toBe('17/10/2569');
  });

  it('extracts digits from mixed text', () => {
    expect(onlyDigits('๑-23ab๔')).toBe('1234');
  });

  it('applies digit style', () => {
    expect(withDigits(25, 'thai')).toBe('๒๕');
    expect(withDigits(25, 'arabic')).toBe('25');
    expect(withDigits(25, undefined)).toBe('25');
  });
});
