#!/usr/bin/env bash
# Pack a Chrome Web Store zip. Strips the unpacked-extension `key` field.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out_dir="$root/dist"
stage="$out_dir/stage"
zip="$out_dir/tweakers-hide-users.zip"

rm -rf "$out_dir"
mkdir -p "$stage/images"

files=(
  background.js
  boot.js
  thu-core.js
  content.js
  content.css
  popup.html
  popup.js
  popup.css
  PRIVACY.md
  README.md
  LICENSE
)
for f in "${files[@]}"; do
  cp "$root/$f" "$stage/$f"
done
cp "$root/images/icon-16.png" "$stage/images/icon-16.png"
cp "$root/images/icon-48.png" "$stage/images/icon-48.png"
cp "$root/images/icon-128.png" "$stage/images/icon-128.png"

python3 - "$root/manifest.json" "$stage/manifest.json" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
with open(src, encoding="utf-8") as f:
    data = json.load(f)
data.pop("key", None)
with open(dst, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

(cd "$stage" && zip -qr "$zip" .)
echo "Wrote $zip"
