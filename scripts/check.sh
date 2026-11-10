#!/usr/bin/env bash
# Checks one package: typecheck, OpenAPI compile (when it has openapi.ts), and a deploy
# to the throwaway local Executor. Usage: scripts/check.sh <package>
set -uo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
name="$1"
dir="$root/packages/$name"
[ -f "$dir/index.ts" ] && [ -f "$dir/package.json" ] && [ -f "$dir/icon.ts" ] || { echo "$name: missing index.ts, package.json or icon.ts"; exit 1; }
jq -e --arg n "@executor.sh/$name" '.name == $n and (.executor.title | type == "string") and (.dependencies.apps == "0.0.1-beta.100")' "$dir/package.json" >/dev/null \
  || { echo "$name: package.json needs name @executor.sh/$name, executor.title and apps 0.0.1-beta.100"; exit 1; }
# defineApp rejects more than 8 icons or more than 32 KiB of them when the package loads.
node -e 'import(process.argv[1]).then(({ icons }) => { const size = JSON.stringify(icons).length; if (!Array.isArray(icons) || icons.length > 8 || size > 32768) { console.error(`${process.argv[2]}: icon.ts needs at most 8 icons totalling at most 32 KiB (has ${icons?.length} icons, ${Math.ceil(size / 1024)} KiB)`); process.exit(1); } })' "$dir/icon.ts" "$name" 2>&1 | grep -v 'extra certs\|ExperimentalWarning\|--trace-warnings'
[ "${PIPESTATUS[0]}" -eq 0 ] || exit 1
# Google packages carry copies of shared sources; a stale copy would ship old tools.
case "$name" in google|gmail|google-*)
  (cd "$root" && node scripts/google-vendor.ts --check 2>&1 | grep -v 'extra certs')
  [ "${PIPESTATUS[0]}" -eq 0 ] || exit 1 ;;
esac
mkdir -p "$root/.local/tsc"
config="$root/.local/tsc/$name.json"
printf '{"extends":"../../tsconfig.json","include":["../../packages/%s/*.ts"]}\n' "$name" > "$config"
if ! errors="$("$root/node_modules/.bin/tsc" -p "$config" 2>&1)"; then
  printf '%s\n' "$errors" | grep -v 'extra certs'
  echo "$name: TYPECHECK FAILED"; exit 1
fi
echo "$name: typecheck ok"
if [ -f "$dir/openapi.ts" ]; then
  (cd "$root" && node scripts/tools.ts "$name" 2>&1 | grep -v 'extra certs') || exit 1
fi
"$root/scripts/deploy.sh" "$name"
