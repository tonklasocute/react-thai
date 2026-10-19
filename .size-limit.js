// Gzip budgets. Thai strings are measured as UTF-8, as Vite/webpack/Next emit them.
const utf8 = (config) => ({ ...config, charset: 'utf8' });

export default [
  {
    name: 'ThaiDatePicker',
    path: 'dist/date-picker.js',
    import: '{ ThaiDatePicker }',
    limit: '12 kB',
    gzip: true,
  },
  {
    name: 'ThaiDatePicker + ThaiDateRangePicker + useThaiCalendar',
    path: 'dist/date-picker.js',
    import: '*',
    limit: '12 kB',
    gzip: true,
  },
  {
    name: 'ThaiAddressInput (code only, data is lazy)',
    path: 'dist/address.js',
    import: '{ ThaiAddressInput }',
    ignore: ['./address-data-th.js', './address-data-en.js'],
    limit: '6 kB',
    gzip: true,
  },
  {
    name: 'ThaiIdInput',
    path: 'dist/thai-id.js',
    import: '{ ThaiIdInput }',
    limit: '3 kB',
    gzip: true,
  },
  {
    name: 'ThaiPhoneInput',
    path: 'dist/phone.js',
    import: '{ ThaiPhoneInput }',
    limit: '3 kB',
    gzip: true,
  },
  {
    name: 'BahtText',
    path: 'dist/baht-text.js',
    import: '{ BahtText }',
    limit: '3 kB',
    gzip: true,
  },
  { name: 'validators (all)', path: 'dist/validators.js', import: '*', limit: '2 kB', gzip: true },
  {
    name: 'Address data: Thai (lazy chunk)',
    path: 'dist/address-data-th.js',
    limit: '62 kB',
    gzip: true,
  },
  {
    name: 'Address data: English names (lazy chunk)',
    path: 'dist/address-data-en.js',
    limit: '36 kB',
    gzip: true,
  },
].map((check) => ({ ...check, modifyEsbuildConfig: utf8 }));
