import { copyFile, mkdir } from 'node:fs/promises';
import { defineConfig, type Options } from 'tsup';

type Plugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * The address dataset is loaded with `import('./data/th')`. Instead of letting
 * esbuild inline it (CJS has no code splitting), we emit each dataset as its own
 * entry and rewrite the import to point at the sibling file in `dist/`.
 */
const externalAddressData = (format: 'esm' | 'cjs'): Plugin => ({
  name: 'external-address-data',
  setup(build) {
    build.onResolve({ filter: /^\.\/data\/(th|en)$/ }, (args) => {
      if (!args.importer.includes('address')) return undefined;
      const lang = args.path.slice('./data/'.length);
      return { path: `./address-data-${lang}.${format === 'cjs' ? 'cjs' : 'js'}`, external: true };
    });
  },
});

const shared: Options = {
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  target: 'es2020',
  treeshake: true,
  splitting: true,
  minify: false,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'zod'],
  esbuildPlugins: [],
};

export default defineConfig([
  // Server-safe entries: pure functions and hook-free components. No "use client".
  {
    ...shared,
    entry: {
      validators: 'src/validators/index.ts',
      zod: 'src/zod/index.ts',
      'baht-text': 'src/baht-text/index.ts',
      'address-data-th': 'src/address/data/th.ts',
      'address-data-en': 'src/address/data/en.ts',
    },
  },
  // Interactive components: every output file starts with "use client".
  ...(['esm', 'cjs'] as const).map((format): Options => ({
    ...shared,
    format: [format],
    entry: {
      index: 'src/index.ts',
      'date-picker': 'src/date-picker/index.ts',
      address: 'src/address/index.ts',
      'thai-id': 'src/thai-id/index.ts',
      phone: 'src/phone/index.ts',
    },
    banner: { js: '"use client";' },
    esbuildPlugins: [externalAddressData(format)],
    async onSuccess() {
      await mkdir('dist', { recursive: true });
      await copyFile('src/styles/styles.css', 'dist/styles.css');
    },
  })),
]);
