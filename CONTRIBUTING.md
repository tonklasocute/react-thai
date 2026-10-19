# Contributing to react-thai

Thanks for helping! Issues and pull requests are welcome in English or Thai.

## Setup

```bash
corepack enable          # uses the pnpm version pinned in package.json
pnpm install
pnpm exec playwright install chromium   # for Storybook tests and media capture
```

## Everyday commands

| Command                                               | What it does                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm storybook`                                      | Storybook at http://localhost:6006 (docs + manual testing)                        |
| `pnpm test` / `pnpm test:watch`                       | Vitest unit and interaction tests (jsdom)                                         |
| `pnpm test:coverage`                                  | Tests with coverage (thresholds: 85%)                                             |
| `pnpm lint` / `pnpm format`                           | ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier                      |
| `pnpm typecheck`                                      | `tsc --noEmit`                                                                    |
| `pnpm build`                                          | tsup → `dist/` (ESM + CJS + `.d.ts`)                                              |
| `pnpm size`                                           | Bundle budgets (size-limit, gzip)                                                 |
| `pnpm check:exports`                                  | publint + are-the-types-wrong                                                     |
| `pnpm build-storybook && pnpm test-storybook --url …` | Play functions + axe on every story (see `ci.yml`)                                |
| `pnpm examples:verify`                                | Pack the library and build `examples/vite` and `examples/nextjs` from the tarball |
| `pnpm data:build`                                     | Regenerate the address dataset                                                    |
| `pnpm media:capture`                                  | Re-record the README GIFs (after `pnpm build-storybook`)                          |

## Guidelines

- **Dates**: never use `toISOString`, `Date.UTC` or `new Date('YYYY-MM-DD')` for calendar days; use the helpers in `src/core/date.ts`. Run the suite in other zones before sending date changes:
  `TZ=America/Los_Angeles pnpm test && TZ=Pacific/Kiritimati pnpm test && TZ=America/Santiago pnpm test`.
- **Accessibility**: keyboard behaviour follows the WAI-ARIA APG patterns. Add a test for every key you handle, and keep stories free of axe violations.
- **SSR**: no `window`/`document` access during render; use effects.
- **Bundle size**: check `pnpm size` before and after. Budgets live in `.size-limit.js`.
- **Every component change** needs tests (Vitest + Testing Library + user-event) and, for visible changes, a story.
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat(date-picker): …`, `fix(address): …`.

## Updating the address dataset

1. `pnpm data:build --ref <new tag of kongvut/thai-province-data>` (or `--from <dir>` for local files).
2. Update `SOURCE_REF` in `scripts/build-address-data.ts` and the data table in both READMEs (`src/address/data/meta.json` has the numbers).
3. `pnpm test` (dataset sanity tests) and `pnpm size`.

## Releasing (maintainers)

Add a changeset to every user-facing PR:

```bash
pnpm changeset
```

On `main`, the Release workflow opens a "chore: release" PR that bumps the version and updates `CHANGELOG.md`. Merging it runs `scripts/release.sh`, which publishes to npm with provenance through [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, no `NPM_TOKEN`), then pushes the `vX.Y.Z` tag and creates the GitHub release. The trusted publisher is bound to `.github/workflows/release.yml`, so keep that file name.
