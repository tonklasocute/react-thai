#!/usr/bin/env bash
# Publishes the current package.json version if it is not on npm yet, then tags it and
# creates a GitHub release. The Release workflow runs this on every push to main once the
# version PR is merged; it authenticates with npm trusted publishing (OIDC), no NPM_TOKEN.
set -euo pipefail

name=$(node -p "require('./package.json').name")
version=$(node -p "require('./package.json').version")

if [ -n "$(npm view "$name@$version" version 2>/dev/null || true)" ]; then
  echo "$name@$version is already on npm, nothing to publish."
  exit 0
fi

pnpm build
npm publish --access public --provenance

git tag "v$version"
git push origin "v$version"
notes=$(awk -v heading="## $version" '$0 == heading { found = 1; next } /^## / { found = 0 } found' CHANGELOG.md)
gh release create "v$version" --title "v$version" --notes "$notes"
