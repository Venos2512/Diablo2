#!/bin/bash
# Run a JS step in the Tripo tab with lib.js prepended: step.sh '<async body returning a value>'
cd "$(dirname "$0")"
tmp=$(mktemp --suffix=.js)
{ echo "(async () => {"; cat lib.js; echo "$1"; echo "})()"; } > "$tmp"
node cdp.mjs evalfile "$tmp"
rc=$?
rm -f "$tmp"
exit $rc
