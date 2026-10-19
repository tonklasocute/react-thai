import { beforeAll, describe, expect, it } from 'vitest';
import { data as en } from './data/en';
import meta from './data/meta.json';
import { data as th } from './data/th';
import { formatThaiAddress } from './format';
import {
  type AddressIndex,
  buildAddressIndex,
  findByPostcode,
  normalizeThai,
  searchAddresses,
} from './search';

let index: AddressIndex;
let indexEn: AddressIndex;
beforeAll(() => {
  index = buildAddressIndex(th);
  indexEn = buildAddressIndex(th, en);
});

const first = (q: string, o?: Parameters<typeof searchAddresses>[2]) =>
  searchAddresses(index, q, o)[0]?.address;

describe('dataset', () => {
  it('has every subdistrict with a postcode and matches meta.json', () => {
    expect(index.records).toHaveLength(meta.counts.subdistricts);
    expect(new Set(index.records.map((r) => r.address.province)).size).toBe(77);
    expect(index.records.every((r) => /^\d{5}$/.test(r.address.postcode))).toBe(true);
    expect(index.version).toBe(meta.ref);
  });

  it('uses แขวง/เขต only in Bangkok', () => {
    for (const { address: a } of index.records) {
      expect(a.isBangkok).toBe(a.province === 'กรุงเทพมหานคร');
      expect(a.subdistrictPrefix).toBe(a.isBangkok ? 'แขวง' : 'ตำบล');
      expect(a.districtPrefix).toBe(a.isBangkok ? 'เขต' : 'อำเภอ');
    }
  });
});

describe('searchAddresses', () => {
  it('finds by postcode prefix only', () => {
    expect(first('10200')).toMatchObject({
      subdistrict: 'พระบรมมหาราชวัง',
      district: 'พระนคร',
      province: 'กรุงเทพมหานคร',
      postcode: '10200',
      isBangkok: true,
    });
    expect(
      searchAddresses(index, '102', { limit: 50 }).every((r) =>
        r.address.postcode.startsWith('102'),
      ),
    ).toBe(true);
    expect(searchAddresses(index, '0200')).toEqual([]);
  });

  it('ranks exact names first', () => {
    expect(first('บางรัก')).toMatchObject({
      subdistrict: 'บางรัก',
      district: 'บางรัก',
      postcode: '10500',
    });
    expect(first('สุเทพ')).toMatchObject({
      subdistrict: 'สุเทพ',
      district: 'เมืองเชียงใหม่',
      province: 'เชียงใหม่',
      postcode: '50200',
      isBangkok: false,
    });
  });

  it('matches "contains" as well as prefix', () => {
    const results = searchAddresses(index, 'เทพ', { limit: 100 });
    expect(results.some((r) => r.address.subdistrict === 'สุเทพ')).toBe(true);
  });

  it('requires every token and understands prefixes and aliases', () => {
    expect(first('ต.สุเทพ')?.subdistrict).toBe('สุเทพ');
    expect(first('ตำบล สุเทพ อ.เมืองเชียงใหม่ จ.เชียงใหม่')?.subdistrict).toBe('สุเทพ');
    expect(first('กทม บางรัก')?.province).toBe('กรุงเทพมหานคร');
    expect(searchAddresses(index, 'สุเทพ ภูเก็ต')).toEqual([]);
  });

  it('prefers whole-phrase matches for multi-word queries', () => {
    expect(first('เมือง เชียงใหม่')?.district).toBe('เมืองเชียงใหม่');
  });

  it('normalises whitespace and ํา vs ำ', () => {
    expect(first('   สุเทพ    เชียงใหม่  ')?.subdistrict).toBe('สุเทพ');
    expect(normalizeThai('ลําพูน')).toBe('ลำพูน');
    expect(first('ลําพูน', { field: 'province' })?.province).toBe('ลำพูน');
  });

  it('limits results and restricts to a field', () => {
    expect(searchAddresses(index, 'เมือง', { limit: 5 })).toHaveLength(5);
    const byDistrict = searchAddresses(index, 'บางรัก', { field: 'district', limit: 50 });
    expect(byDistrict.every((r) => r.address.district.includes('บางรัก'))).toBe(true);
    expect(searchAddresses(index, '   ')).toEqual([]);
  });

  it('returns highlight ranges', () => {
    const [hit] = searchAddresses(index, 'เทพ', { field: 'subdistrict' });
    const m = hit!.matches.subdistrict!;
    expect(hit!.address.subdistrict.slice(m.start, m.end)).toBe('เทพ');
    expect(m.lang).toBe('th');
  });

  it('matches English names when loaded', () => {
    expect(indexEn.hasEnglish).toBe(true);
    const [hit] = searchAddresses(indexEn, 'phra nakhon');
    expect(hit!.address.district).toBe('พระนคร');
    expect(hit!.address.en).toEqual({
      subdistrict: 'Phra Borom Maha Ratchawang',
      district: 'Phra Nakhon',
      province: 'Bangkok',
    });
    expect(hit!.matches.district?.lang).toBe('en');
    expect(searchAddresses(index, 'phra nakhon')).toEqual([]);
  });

  it('searches the whole dataset quickly', () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) searchAddresses(index, 'เมือง');
    expect((performance.now() - start) / 20).toBeLessThan(30);
  });
});

describe('findByPostcode / formatThaiAddress', () => {
  it('looks up exact postcodes', () => {
    expect(findByPostcode(index, '10200').length).toBeGreaterThan(5);
    expect(findByPostcode(index, ' 50200 ').map((a) => a.subdistrict)).toContain('สุเทพ');
    expect(findByPostcode(index, '99999')).toEqual([]);
  });

  it('formats Bangkok and provincial addresses', () => {
    expect(formatThaiAddress(first('10200')!)).toBe(
      'แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร 10200',
    );
    const suthep = first('สุเทพ')!;
    expect(formatThaiAddress(suthep)).toBe('ตำบลสุเทพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200');
    expect(formatThaiAddress(suthep, { prefixes: false })).toBe(
      'สุเทพ เมืองเชียงใหม่ เชียงใหม่ 50200',
    );
    const english = searchAddresses(indexEn, 'สุเทพ')[0]!.address;
    expect(formatThaiAddress(english, { english: true })).toBe(
      'Suthep, Mueang Chiang Mai, Chiang Mai 50200',
    );
    expect(formatThaiAddress(suthep, { english: true })).toContain('ตำบลสุเทพ');
  });
});
