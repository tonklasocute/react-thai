/** Compact Thai dataset (see scripts/build-address-data.ts). */
export interface CompactThaiData {
  /** Source version (git tag of kongvut/thai-province-data). */
  v: string;
  /** Province names. */
  p: string[];
  /** Flat `[districtName, provinceIndex, ...]`. */
  d: Array<string | number>;
  /** Flat `[subdistrictName, districtIndex, ...]`, sorted by postcode. */
  s: Array<string | number>;
  /** Run-length postcode index: `[postcode, count, ...]` in the order of `s`. */
  z: number[];
}

/** English names aligned with {@link CompactThaiData}. */
export interface CompactEnglishData {
  v: string;
  p: string[];
  d: string[];
  s: string[];
}

export type AddressField = 'subdistrict' | 'district' | 'province' | 'postcode';

/** A complete address as returned by the components and hooks. */
export interface ThaiAddress {
  /** ตำบล (or แขวง in Bangkok), without the prefix. */
  subdistrict: string;
  /** อำเภอ (or เขต in Bangkok), without the prefix. */
  district: string;
  province: string;
  /** Five-digit postcode as a string (keeps leading zeros semantics). */
  postcode: string;
  /** `true` for กรุงเทพมหานคร, where subdistrict/district are called แขวง/เขต. */
  isBangkok: boolean;
  /** "แขวง" in Bangkok, otherwise "ตำบล". */
  subdistrictPrefix: 'แขวง' | 'ตำบล';
  /** "เขต" in Bangkok, otherwise "อำเภอ". */
  districtPrefix: 'เขต' | 'อำเภอ';
  /** English names, present when English data is loaded (`includeEnglish`). */
  en?: { subdistrict: string; district: string; province: string };
}
