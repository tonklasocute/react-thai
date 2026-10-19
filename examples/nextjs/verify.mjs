// Starts the production server and checks SSR output and the Route Handler.
import { spawn } from 'node:child_process';

const server = spawn('npx', ['next', 'start', '-p', '3123'], { stdio: 'inherit' });
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  server.kill();
  process.exit(1);
};

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      return await fetch('http://127.0.0.1:3123/');
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  fail('server did not start');
}

const page = await (await waitForServer()).text();
for (const needle of [
  'วว/ดด/ปปปป',
  'หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์',
  'server validator: <!-- -->true',
  'ตำบล/แขวง',
]) {
  if (!page.includes(needle)) fail(`SSR HTML is missing "${needle}"`);
}
if (page.includes('พระบรมมหาราชวัง')) fail('address data leaked into the SSR HTML');
console.log('✓ SSR renders date picker, address fields and BahtText');

const api = await (
  await fetch('http://127.0.0.1:3123/api/validate?id=1101700203450&birthday=2026-10-17')
).json();
if (!api.idValid || api.birthday !== '2026-10-17')
  fail(`unexpected API response ${JSON.stringify(api)}`);
console.log('✓ Route Handler validates with react-thai/zod on the server');
server.kill();
