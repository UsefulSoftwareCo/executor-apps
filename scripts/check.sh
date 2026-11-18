#!/usr/bin/env bash
# Checks one package: typecheck, OpenAPI compile (when it has openapi.ts), and a deploy
# to the throwaway local Executor. Usage: scripts/check.sh <package>
set -uo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
name="$1"
dir="$root/packages/$name"
[ -f "$dir/index.ts" ] && [ -f "$dir/package.json" ] && [ -f "$dir/icon.ts" ] || { echo "$name: missing index.ts, package.json or icon.ts"; exit 1; }
# Every package pins the same apps version, except packages that need an option from a later one.
apps="0.0.1-beta.140"
case "$name" in
  # pkce: false, first in 0.0.1-beta.142: LinkedIn refuses a token request carrying code_verifier.
  linkedin|linkedinads) apps="0.0.1-beta.142" ;;
esac
jq -e --arg n "@executor.sh/$name" --arg apps "$apps" '.name == $n and (.executor.title | type == "string") and (.dependencies.apps == $apps)' "$dir/package.json" >/dev/null \
  || { echo "$name: package.json needs name @executor.sh/$name, executor.title and apps $apps"; exit 1; }
# defineApp rejects more than 8 icons or more than 32 KiB of them when the package loads.
node -e 'import(process.argv[1]).then(({ icons }) => { const size = JSON.stringify(icons).length; if (!Array.isArray(icons) || icons.length > 8 || size > 32768) { console.error(`${process.argv[2]}: icon.ts needs at most 8 icons totalling at most 32 KiB (has ${icons?.length} icons, ${Math.ceil(size / 1024)} KiB)`); process.exit(1); } })' "$dir/icon.ts" "$name" 2>&1 | grep -v 'extra certs\|ExperimentalWarning\|--trace-warnings'
[ "${PIPESTATUS[0]}" -eq 0 ] || exit 1
# A sign-in method's label is its short name (AUTHORING.md, "Auth"): the sign-in method menu and
# the fix prompt show it. Explanations go in the guide or field descriptions. The methods listed in
# long-labels.tsv predate the limit and keep their labels, which are part of their providers' identity.
bun -e 'const [file, name, listed] = process.argv.slice(-3); const kept = new Set((await Bun.file(listed).text()).split("\n").filter((line) => line !== "" && !line.startsWith("#"))); const app = (await import(file)).default; const accounts = app.accounts ?? {}; const long = [...Object.values(accounts.app ?? {}), ...Object.values(accounts.user ?? {})].flatMap((r) => Object.entries((r.provider ?? r).auth ?? {})).filter(([method, m]) => typeof m.label === "string" && m.label.length > 40 && !kept.has(`${name}\t${method}`)); for (const [method, m] of long) console.error(`${name}: label of ${method} is ${m.label.length} characters, more than 40: "${m.label}". Use a short name such as "API key" and move the explanation to the guide or a field description`); if (long.length > 0) process.exit(1);' "$dir/index.ts" "$name" "$root/scripts/long-labels.tsv" 2>&1 | grep -v 'extra certs'
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
