#!/usr/bin/env bash
# Builds react-thai, packs it like `npm publish` would, installs the tarball into fresh
# Vite (React 18) and Next.js (React 19) apps, builds them and checks the output.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm build
mkdir -p .cache
rm -f .cache/react-thai*.tgz
pnpm pack --pack-destination .cache >/dev/null
mv .cache/react-thai-*.tgz .cache/react-thai.tgz

for example in vite nextjs; do
  echo "▶ examples/$example"
  cd "$ROOT/examples/$example"
  rm -rf node_modules dist .next package-lock.json
  npm install --no-audit --no-fund --loglevel=error
  npm run build
  npm run verify
done

# CommonJS consumers can require the server-safe entries.
cd "$ROOT/examples/nextjs"
node -e "
const v = require('react-thai/validators');
if (!v.isValidThaiId('1101700203450') || v.bahtText(21) !== 'ยี่สิบเอ็ดบาทถ้วน') process.exit(1);
console.log('✓ require(\"react-thai/validators\") works from CommonJS');
"
