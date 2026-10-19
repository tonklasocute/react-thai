/**
 * Captures README media from the built Storybook with Playwright.
 *
 *   pnpm build-storybook && pnpm media:capture
 *
 * Writes docs/date-picker.gif, docs/address.gif and PNG stills next to them.
 */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import gifenc from 'gifenc';
import { chromium, type Page } from 'playwright';
import { PNG } from 'pngjs';

const { applyPalette, GIFEncoder, quantize } = gifenc; // CommonJS package
const PORT = 6107;
const DOCS = join(import.meta.dirname, '../docs');
const VIEWPORT = { width: 620, height: 470 };

interface Frame {
  png: Buffer;
  delay: number;
}

const server = spawn(
  'pnpm',
  ['exec', 'http-server', 'storybook-static', '-p', String(PORT), '-s'],
  {
    stdio: 'ignore',
  },
);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/iframe.html`)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Storybook server did not start (run `pnpm build-storybook` first)');
}

async function openStory(page: Page, id: string) {
  await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${id}&viewMode=story`);
  await page.waitForSelector('#storybook-root *');
  await page.addStyleTag({ content: '.sb-surface{min-height:100vh} *{caret-color:transparent}' });
}

function encodeGif(frames: Frame[]): Uint8Array {
  const gif = GIFEncoder();
  for (const { png, delay } of frames) {
    const { data, width, height } = PNG.sync.read(png);
    const rgba = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const palette = quantize(rgba, 256);
    gif.writeFrame(applyPalette(rgba, palette), width, height, { palette, delay });
  }
  gif.finish();
  return gif.bytes();
}

async function record(page: Page, steps: Array<[action: () => Promise<unknown>, hold: number]>) {
  const frames: Frame[] = [];
  for (const [action, hold] of steps) {
    await action();
    await page.waitForTimeout(80);
    frames.push({ png: await page.screenshot(), delay: hold });
  }
  return frames;
}

async function main() {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'th-TH' });

  // --- Date picker ---------------------------------------------------------
  await openStory(page, 'components-thaidatepicker--with-value');
  const input = page.getByRole('textbox', { name: 'วันเกิด' });
  const datePicker = await record(page, [
    [async () => {}, 900],
    [() => input.fill(''), 300],
    ...[...'29022567'].map((ch): [() => Promise<unknown>, number] => [() => input.press(ch), 140]),
    [async () => {}, 900],
    [() => page.getByRole('button', { name: /เปลี่ยนวันที่/ }).click(), 1100],
    [() => page.keyboard.press('ArrowRight'), 450],
    [() => page.keyboard.press('ArrowDown'), 450],
    [() => page.keyboard.press('PageDown'), 700],
    [() => page.keyboard.press('PageDown'), 700],
    [() => page.keyboard.press('Enter'), 1800],
  ]);
  await writeFile(join(DOCS, 'date-picker.gif'), encodeGif(datePicker));
  await page.getByRole('button', { name: /เปลี่ยนวันที่/ }).click();
  await page.waitForTimeout(100);
  await page.screenshot({ path: join(DOCS, 'date-picker.png') });

  // --- Address -------------------------------------------------------------
  await openStory(page, 'components-thaiaddressinput--search-box');
  const combo = page.getByRole('combobox', { name: 'ที่อยู่' });
  await combo.focus();
  await page.waitForTimeout(300);
  const address = await record(page, [
    [async () => {}, 700],
    ...[...'บางรัก'].map((ch): [() => Promise<unknown>, number] => [
      () => combo.pressSequentially(ch),
      220,
    ]),
    [async () => {}, 1200],
    [() => page.keyboard.press('ArrowDown'), 500],
    [() => page.keyboard.press('ArrowDown'), 500],
    [() => page.keyboard.press('Enter'), 1200],
    [() => combo.fill(''), 300],
    ...[...'50200'].map((ch): [() => Promise<unknown>, number] => [
      () => combo.pressSequentially(ch),
      200,
    ]),
    [async () => {}, 1400],
    [() => page.keyboard.press('ArrowDown'), 500],
    [() => page.keyboard.press('Enter'), 2000],
  ]);
  await writeFile(join(DOCS, 'address.gif'), encodeGif(address));
  await combo.fill('');
  await combo.pressSequentially('บางรัก');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(DOCS, 'address.png') });

  await browser.close();
}

main()
  .then(() => console.log('Wrote docs/date-picker.gif, docs/address.gif and PNG stills'))
  .finally(() => server.kill());
