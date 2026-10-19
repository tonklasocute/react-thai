// Checks the production build: app code is small and the address dataset is a separate chunk.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const dir = new URL('./dist/assets/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
const read = (f) => readFileSync(new URL(f, dir), 'utf8');
const entry = readFileSync(new URL('./dist/index.html', import.meta.url), 'utf8').match(
  /assets\/(index-[^"]+\.js)/,
)[1];
const dataChunks = files.filter((f) => read(f).includes('พระบรมมหาราชวัง'));

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
if (read(entry).includes('พระบรมมหาราชวัง')) fail('address data is inlined in the entry chunk');
if (dataChunks.length !== 1) fail(`expected 1 lazy address-data chunk, found ${dataChunks.length}`);
if (!read(entry).includes('วว/ดด/ปปปป')) fail('date picker not found in the entry chunk');

const kb = (f) => (gzipSync(read(f)).length / 1024).toFixed(1);
console.log(`✓ entry ${entry}: ${kb(entry)} kB gzip (includes React)`);
console.log(`✓ lazy address data ${dataChunks[0]}: ${kb(dataChunks[0])} kB gzip`);
