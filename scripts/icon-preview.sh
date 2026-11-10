#!/usr/bin/env bash
# Renders a package's icon variants on white and on #111 to /tmp/icon-preview/<id>.png.
# Usage: scripts/icon-preview.sh <id>   (needs Chrome or Chromium; uses headless screenshot)
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
id="$1"; out=/tmp/icon-preview; mkdir -p "$out"
node -e '
const [file, id, out] = process.argv.slice(1);
import(file).then(({ icons }) => {
  const pick = (t) => (icons.find((i) => i.theme === t) ?? icons.find((i) => !i.theme) ?? icons[0])?.src ?? "";
  const tile = (bg, src) => `<div style="width:96px;height:96px;background:${bg};display:flex;align-items:center;justify-content:center;border-radius:12px"><img src="${src}" style="width:64px;height:64px;object-fit:contain"></div>`;
  require("fs").writeFileSync(`${out}/${id}.html`, `<body style="margin:0;display:flex;gap:8px;padding:8px;background:#888">${tile("#fff", pick("light"))}${tile("#111", pick("dark"))}</body>`);
});' "$root/packages/$id/icon.ts" "$id" "$out"
chrome="$(ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome /Applications/Helium.app/Contents/MacOS/Helium 2>/dev/null | head -1)"
"$chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=216,112 --screenshot="$out/$id.png" "file://$out/$id.html" >/dev/null 2>&1
echo "$out/$id.png"
