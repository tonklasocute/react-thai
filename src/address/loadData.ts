import { type AddressIndex, buildAddressIndex } from './search';

let thai: Promise<AddressIndex> | null = null;
let withEnglish: Promise<AddressIndex> | null = null;

/**
 * Lazily load and index the address dataset. The data lives in separate chunks
 * (`import()`), so it never lands in your main bundle. Results are cached.
 */
export function loadThaiAddressIndex(includeEnglish = false): Promise<AddressIndex> {
  if (includeEnglish) {
    withEnglish ??= Promise.all([import('./data/th'), import('./data/en')])
      .then(([th, en]) => buildAddressIndex(th.data, en.data))
      .catch((error: unknown) => {
        withEnglish = null;
        throw error;
      });
    return withEnglish;
  }
  thai ??= import('./data/th')
    .then((th) => buildAddressIndex(th.data))
    .catch((error: unknown) => {
      thai = null;
      throw error;
    });
  return thai;
}
