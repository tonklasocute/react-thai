export {
  ThaiAddressInput,
  type ThaiAddressInputProps,
  type AddressInputSlot,
  type AddressLabels,
} from './ThaiAddressInput';
export {
  useThaiAddress,
  type UseThaiAddressOptions,
  type AddressDataStatus,
} from './useThaiAddress';
export {
  searchAddresses,
  buildAddressIndex,
  findByPostcode,
  normalizeThai,
  type AddressIndex,
  type AddressRecord,
  type AddressSuggestion,
  type MatchRange,
  type SearchOptions,
} from './search';
export { loadThaiAddressIndex } from './loadData';
export { formatThaiAddress, type FormatAddressOptions } from './format';
export type { ThaiAddress, AddressField, CompactThaiData, CompactEnglishData } from './types';
