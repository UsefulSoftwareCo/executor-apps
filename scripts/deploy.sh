#!/usr/bin/env bash
# Deploy packages to the Executor named by EXECUTOR_HOST (default: the throwaway local
# server in .local/env), creating each app on first use. Prints one line per package.
# Usage: scripts/deploy.sh <package>...
set -uo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$root/.local/env" ] && source "$root/.local/env"
status=0
for name in "$@"; do
  dir="$root/packages/$name"
  title="$(jq -r '.executor.title // empty' "$dir/package.json")"
  [ -n "$title" ] || title="$name"
  # The CLI truncates piped stdout at 64KB, so capture the list through a file.
  list="$(mktemp)"
  if ! executor apps list >"$list" 2>/dev/null || ! jq -e . "$list" >/dev/null 2>&1; then
    rm -f "$list"
    echo "$name: DEPLOY FAILED could not list apps"; status=1; continue
  fi
  id="$(jq -r --arg t "$title" '(if type == "array" then . else .items end)[] | select(.name == $t) | .id' "$list" | head -1)"
  rm -f "$list"
  if [ -z "$id" ]; then
    tmp="$(mktemp)"
    executor apps create --name "$title" --files "$dir" >"$tmp" 2>/dev/null
    id="$(jq -r '.id // empty' "$tmp")"
    if [ -z "$id" ]; then
      rm -f "$tmp"
      echo "$name: DEPLOY FAILED could not create app"; status=1; continue
    fi
    executor apps source --app "$id" >"$tmp" 2>/dev/null
    commit="$(jq -r .revision.commit "$tmp")"
    executor apps deploy --app "$id" --commit "$commit" >"$tmp" 2>/dev/null
    out="$(cat "$tmp")"; rm -f "$tmp"
  else
    tmp="$(mktemp)"
    executor apps deploy --app "$id" --files "$dir" --message update >"$tmp" 2>/dev/null
    out="$(cat "$tmp")"; rm -f "$tmp"
  fi
  error="$(printf '%s' "$out" | jq -r '.error.message // empty' 2>/dev/null)"
  if [ -z "$id" ] || [ -n "$error" ]; then
    echo "$name: DEPLOY FAILED ${error:-$out}" | head -c 2000; echo
    status=1
  else
    echo "$name: deployed ($id)"
  fi
done
exit $status
