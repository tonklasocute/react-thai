import type { AddressField, CompactEnglishData, CompactThaiData, ThaiAddress } from './types';

const BANGKOK = 'กรุงเทพมหานคร';
const FIELDS: readonly AddressField[] = ['subdistrict', 'district', 'province', 'postcode'];

/**
 * Normalise text for matching: NFC, lower case, collapse whitespace, and fix the common
 * "nikhahit + sara aa" typing (ํ + า) so it matches sara am (ำ).
 */
export const normalizeThai = (text: string): string =>
  text.normalize('NFC').replace(/ํา/g, 'ำ').toLowerCase().replace(/\s+/g, ' ').trim();

/** Prefixes users often type before a name: ต. ตำบล แขวง อ. อำเภอ เขต จ. จังหวัด */
const PREFIX = /^(?:ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.)\s*/;
const ALIASES: Record<string, string> = { กทม: BANGKOK, 'กทม.': BANGKOK, bkk: 'bangkok' };

const tokenize = (query: string): string[] =>
  normalizeThai(query)
    .split(' ')
    .map((t) => ALIASES[t] ?? t.replace(PREFIX, ''))
    .filter(Boolean);

export interface AddressRecord {
  address: ThaiAddress;
  /** Normalised searchable text per field (Thai, plus English when loaded). */
  keys: Record<AddressField, string>;
  en?: Record<Exclude<AddressField, 'postcode'>, string>;
}

export interface AddressIndex {
  version: string;
  records: AddressRecord[];
  hasEnglish: boolean;
}

/** Expand the compact dataset into searchable records. */
export function buildAddressIndex(th: CompactThaiData, en?: CompactEnglishData): AddressIndex {
  const records: AddressRecord[] = [];
  let row = 0;
  for (let z = 0; z < th.z.length; z += 2) {
    const postcode = String(th.z[z]);
    const count = th.z[z + 1] ?? 0;
    for (let n = 0; n < count; n++, row++) {
      const subdistrict = th.s[row * 2] as string;
      const districtIndex = th.s[row * 2 + 1] as number;
      const district = th.d[districtIndex * 2] as string;
      const provinceIndex = th.d[districtIndex * 2 + 1] as number;
      const province = th.p[provinceIndex] ?? '';
      const isBangkok = province === BANGKOK;
      const address: ThaiAddress = {
        subdistrict,
        district,
        province,
        postcode,
        isBangkok,
        subdistrictPrefix: isBangkok ? 'แขวง' : 'ตำบล',
        districtPrefix: isBangkok ? 'เขต' : 'อำเภอ',
      };
      const record: AddressRecord = {
        address,
        keys: {
          subdistrict: normalizeThai(subdistrict),
          district: normalizeThai(district),
          province: normalizeThai(province),
          postcode,
        },
      };
      if (en) {
        address.en = {
          subdistrict: en.s[row] ?? '',
          district: en.d[districtIndex] ?? '',
          province: en.p[provinceIndex] ?? '',
        };
        record.en = {
          subdistrict: normalizeThai(address.en.subdistrict),
          district: normalizeThai(address.en.district),
          province: normalizeThai(address.en.province),
        };
      }
      records.push(record);
    }
  }
  return { version: th.v, records, hasEnglish: !!en };
}

export interface MatchRange {
  start: number;
  end: number;
  /** Which name matched: Thai (`th`) or English (`en`). */
  lang: 'th' | 'en';
}

export interface AddressSuggestion {
  /** Stable key: postcode + names. */
  id: string;
  address: ThaiAddress;
  /** Where the query matched, per field, for highlighting. */
  matches: Partial<Record<AddressField, MatchRange>>;
}

export interface SearchOptions {
  /** Restrict matching to one field (linked-inputs layout). Default: all fields. */
  field?: AddressField;
  /** Maximum results. Default `20`. */
  limit?: number;
}

/**
 * Ranked search. Every query token must match some field; for each token a whole-name
 * match beats a prefix match, which beats a "contains" match. Ties keep postcode order.
 */
export function searchAddresses(
  index: AddressIndex,
  query: string,
  { field, limit = 20 }: SearchOptions = {},
): AddressSuggestion[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const fields = field ? [field] : FIELDS;
  const scored: Array<{ score: number; order: number; suggestion: AddressSuggestion }> = [];

  // Multi-word queries also try the whole phrase ("phra nakhon", "เมือง เชียงใหม่" → "เมืองเชียงใหม่").
  const phrases = tokens.length > 1 ? [tokens.join(' '), tokens.join('')] : [];

  index.records.forEach((record, order) => {
    const matches: AddressSuggestion['matches'] = {};
    /** Best rank of `token` across fields; records highlight ranges as a side effect. */
    const rankOf = (token: string): number => {
      let best = Infinity;
      for (const f of fields) {
        for (const lang of ['th', 'en'] as const) {
          const key =
            lang === 'th' ? record.keys[f] : f === 'postcode' ? undefined : record.en?.[f];
          if (!key) continue;
          const at = key.indexOf(token);
          // Postcodes only match from the start.
          if (at < 0 || (f === 'postcode' && at > 0)) continue;
          const rank = key.length === token.length ? 0 : at === 0 ? 1 : 2;
          // Prefer earlier fields (subdistrict first) on equal rank.
          best = Math.min(best, rank * 10 + FIELDS.indexOf(f));
          // Highlight every field a token occurs in (first match wins per field).
          matches[f] ??= { start: at, end: at + token.length, lang };
        }
      }
      return best;
    };

    let score = Infinity;
    for (const phrase of phrases) score = Math.min(score, rankOf(phrase) - 1000);
    if (score === Infinity) {
      score = 0;
      for (const token of tokens) {
        const rank = rankOf(token);
        if (rank === Infinity) return;
        score += rank;
      }
    }
    const a = record.address;
    scored.push({
      score,
      order,
      suggestion: {
        id: `${a.postcode}-${a.province}-${a.district}-${a.subdistrict}`,
        address: a,
        matches,
      },
    });
  });

  scored.sort((x, y) => x.score - y.score || x.order - y.order);
  return scored.slice(0, limit).map((s) => s.suggestion);
}

/** All addresses with this postcode (exact match). */
export const findByPostcode = (index: AddressIndex, postcode: string): ThaiAddress[] =>
  index.records.filter((r) => r.address.postcode === postcode.trim()).map((r) => r.address);
