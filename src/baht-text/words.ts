const DIGITS: readonly string[] = [
  'ศูนย์',
  'หนึ่ง',
  'สอง',
  'สาม',
  'สี่',
  'ห้า',
  'หก',
  'เจ็ด',
  'แปด',
  'เก้า',
];
const PLACES: readonly string[] = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

/**
 * Read up to six digits. `leadingNonZero` says whether a higher digit exists, which turns a
 * trailing 1 into 'เอ็ด' (101 → หนึ่งร้อยเอ็ด, 1,000,001 → หนึ่งล้านเอ็ด).
 */
function readGroup(group: string, leadingNonZero: boolean): string {
  let out = '';
  let seen = leadingNonZero;
  for (let i = 0; i < group.length; i++) {
    const d = Number(group[i]);
    const place = group.length - 1 - i;
    if (d) {
      if (place === 0) out += d === 1 && seen ? 'เอ็ด' : (DIGITS[d] ?? '');
      else if (place === 1) out += (d === 1 ? '' : d === 2 ? 'ยี่' : (DIGITS[d] ?? '')) + 'สิบ';
      else out += (DIGITS[d] ?? '') + (PLACES[place] ?? '');
      seen = true;
    }
  }
  return out;
}

/** Read a non-negative integer string of any length using ล้าน recursively. */
function readInteger(digits: string, leadingNonZero = false): string {
  if (digits.length <= 6) return readGroup(digits, leadingNonZero);
  const high = digits.slice(0, -6);
  const highText = readInteger(high, leadingNonZero);
  return `${highText}ล้าน${readGroup(digits.slice(-6), leadingNonZero || /[1-9]/.test(high))}`;
}

/** Parse to `[negative, bahtDigits, satang]`, rounding half-up to 2 decimals without floats. */
function parseAmount(value: number | string | bigint): [boolean, string, number] {
  let text: string;
  if (typeof value === 'bigint') text = value.toString();
  else if (typeof value === 'number') {
    if (!Number.isFinite(value) || Math.abs(value) >= 1e21)
      throw new RangeError(`Invalid amount: ${value}`);
    text = value.toFixed(2);
  } else text = value.replace(/[,\s฿]/g, '').replace(/บาท$/, '');
  const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(text);
  if (!match || (!match[2] && !match[3])) throw new RangeError(`Invalid amount: ${String(value)}`);
  const fraction = (match[3] ?? '').padEnd(3, '0');
  let baht = BigInt(match[2] || '0');
  let satang = Number(fraction.slice(0, 2)) + (Number(fraction[2]) >= 5 ? 1 : 0);
  if (satang === 100) {
    baht += 1n;
    satang = 0;
  }
  return [match[1] === '-' && (baht > 0n || satang > 0), baht.toString(), satang];
}

/**
 * Thai baht text, like Excel's BAHTTEXT:
 * `bahtText(1234.5)` → "หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์",
 * `bahtText(21)` → "ยี่สิบเอ็ดบาทถ้วน". Pass strings or bigints for exact large amounts.
 */
export function bahtText(value: number | string | bigint): string {
  const [negative, baht, satang] = parseAmount(value);
  const sign = negative ? 'ลบ' : '';
  const bahtPart = baht === '0' ? '' : `${readInteger(baht)}บาท`;
  if (!satang) return `${sign}${bahtPart || 'ศูนย์บาท'}ถ้วน`;
  return `${sign}${bahtPart}${readGroup(String(satang), false)}สตางค์`;
}
