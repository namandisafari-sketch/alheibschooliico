#!/bin/bash
set -e
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

ARCHIVE_DIR="$REPO_DIR/.old-assets-archive"

# Archive current assets before build (persistent across builds)
if [ -d "dist/assets" ]; then
  mkdir -p "$ARCHIVE_DIR"
  for f in dist/assets/*; do
    name=$(basename "$f")
    if [ ! -f "$ARCHIVE_DIR/$name" ]; then
      cp "$f" "$ARCHIVE_DIR/$name"
    fi
  done
  echo "  Archived $(ls dist/assets/*.js dist/assets/*.css 2>/dev/null | wc -l) current assets for chunk preservation"
fi

npx vite build && npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

# Restore old chunks from archive that aren't in the new build
if [ -d "$ARCHIVE_DIR" ]; then
  count=0
  for f in "$ARCHIVE_DIR"/*; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    if [ ! -f "dist/assets/$name" ]; then
      cp "$f" "dist/assets/$name"
      count=$((count + 1))
    fi
  done
  echo "  Preserved $count old chunks from archive (users with cached pages won't get 404s)"
fi