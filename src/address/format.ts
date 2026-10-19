import type { ThaiAddress } from './types';

export interface FormatAddressOptions {
  /** Include ตำบล/แขวง, อำเภอ/เขต, จังหวัด prefixes. Default `true`. */
  prefixes?: boolean;
  /** Use English names (requires `includeEnglish` data). Default `false`. */
  english?: boolean;
}

/**
 * One-line address:
 * "แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร 10200",
 * "ตำบลสุเทพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200".
 */
export function formatThaiAddress(
  address: ThaiAddress,
  { prefixes = true, english = false }: FormatAddressOptions = {},
): string {
  if (english && address.en) {
    const { subdistrict, district, province } = address.en;
    return `${subdistrict}, ${district}, ${province} ${address.postcode}`;
  }
  const { subdistrict, district, province, postcode, isBangkok } = address;
  if (!prefixes) return `${subdistrict} ${district} ${province} ${postcode}`;
  return `${address.subdistrictPrefix}${subdistrict} ${address.districtPrefix}${district} ${
    isBangkok ? '' : 'จังหวัด'
  }${province} ${postcode}`;
}
