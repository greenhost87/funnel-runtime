#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ARTIFACT_NAME="${ARTIFACT_NAME:-funnel-runtime.tar.gz}"
ARTIFACT_PATH="$ROOT_DIR/$ARTIFACT_NAME"
ARTIFACT_DIR="$ROOT_DIR/dist-deploy"

fail() {
  echo "$1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [ -f "$path" ] || fail "Required file not found: $path"
}

require_dir() {
  local path="$1"
  [ -d "$path" ] || fail "Required directory not found: $path"
}

main() {
  cd "$ROOT_DIR"

  require_file package.json
  require_file bun.lock
  require_file next.config.ts
  require_file tsconfig.json
  require_file system/config/environment.ts
  require_file system/config/base-path.ts
  require_dir system/database
  require_file scripts/migrate.ts
  require_file scripts/validate-production-env.ts
  require_file app/api/health/route.ts
  require_dir migrations

  rm -rf "$ARTIFACT_DIR" "$ARTIFACT_PATH"

  bun run fmt:check
  bun --bun next typegen && bunx tsc --noEmit
  bun test
  bun --bun next build

  require_dir .next

  mkdir -p \
    "$ARTIFACT_DIR/scripts" \
    "$ARTIFACT_DIR/system/config" \
    "$ARTIFACT_DIR/system/database"
  cp -R .next "$ARTIFACT_DIR/"
  rm -rf "$ARTIFACT_DIR/.next/cache" "$ARTIFACT_DIR/.next/dev"
  cp package.json bun.lock next.config.ts tsconfig.json bunfig.toml "$ARTIFACT_DIR/"
  cp system/config/environment.ts system/config/base-path.ts "$ARTIFACT_DIR/system/config/"
  cp -R system/database "$ARTIFACT_DIR/system/"
  cp scripts/migrate.ts scripts/validate-production-env.ts "$ARTIFACT_DIR/scripts/"
  cp -R migrations "$ARTIFACT_DIR/"

  if [ -d public ]; then
    cp -R public "$ARTIFACT_DIR/"
  fi

  tar -czf "$ARTIFACT_PATH" -C "$ARTIFACT_DIR" .
  rm -rf "$ARTIFACT_DIR"

  require_file "$ARTIFACT_PATH"
  echo "Deployment artifact created: $ARTIFACT_PATH"
}

main "$@"
