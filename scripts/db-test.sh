#!/usr/bin/env bash
# Runs the migrations that are not yet applied on the linked project, plus the SQL scenario tests in
# supabase/tests/, inside ONE transaction that is always rolled back: the hosted database is never
# changed. Needs SUPABASE_ACCESS_TOKEN (read from .env.local).
# (`supabase test db` needs Docker for a local stack; this works without it.)
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi

applied="$(npx supabase db query --linked -o json \
  "select coalesce(string_agg(version, ' '), '') as v from supabase_migrations.schema_migrations" 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=s.match(/"v":\s*"([^"]*)"/);process.stdout.write(m?m[1]:"")})')"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
{
  echo "begin;"
  for f in supabase/migrations/*.sql; do
    version="$(basename "$f" | cut -d_ -f1)"
    case " $applied " in *" $version "*) continue ;; esac
    echo "-- >>> pending migration $f" >&2
    echo "-- >>> $f"; cat "$f"; echo
  done
  for f in supabase/tests/*.sql; do echo "-- >>> $f"; cat "$f"; echo; done
  echo "rollback;"
} > "$tmp"
out="$(npx supabase db query --linked -f "$tmp" 2>&1)" || { echo "$out"; exit 1; }
if echo "$out" | grep -q "SMOKE TEST PASSED"; then echo "$out" | grep -o "[A-Z]* SMOKE TEST PASSED" | sort -u; echo "SQL tests passed (rolled back)."; else echo "$out"; exit 1; fi
