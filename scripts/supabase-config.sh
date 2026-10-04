#!/usr/bin/env bash
# Pushes supabase/config.toml to the hosted project. It overwrites the dashboard's auth settings, so it refuses to
# run without the provider secrets that are enabled in the file (otherwise Google login would be switched off).
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi
for v in SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET; do
  if [ -z "${!v:-}" ]; then
    echo "Refusing to push: $v is not set in .env.local (Google login would be switched off)." >&2
    exit 1
  fi
done
npx supabase config push --yes
