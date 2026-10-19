# Examples

Both apps install react-thai from the packed tarball (`.cache/react-thai.tgz`), exactly like a user installing from npm.

```bash
pnpm examples:verify   # build, pack, install, build both apps and run their checks
```

- `vite/`: Vite 7 + React 18. Checks that the address data is a separate lazy chunk.
- `nextjs/`: Next.js 16 App Router + React 19. Checks SSR output, a Server Component using a client component, and a Route Handler using `react-thai/zod`.

To run one by hand after `examples:verify`: `cd examples/vite && npm run dev`.
