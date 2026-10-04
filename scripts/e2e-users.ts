/**
 * Creates (or resets) the end-to-end test accounts, already confirmed, through the admin API.
 * Their shared password is generated once and kept in .env.test.local (git-ignored).
 * They are normal accounts: onboarding is part of the tests. Remove them with --delete.
 *
 *   npx tsx scripts/e2e-users.ts            create / reset
 *   npx tsx scripts/e2e-users.ts --delete   remove them and everything they posted
 */
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

import { createClient } from "@supabase/supabase-js"

function loadEnv(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}
loadEnv(".env.local")
loadEnv(".env.test.local")

export const E2E_USERS = {
  poster: "pocket-e2e-poster@example.com",
  helper: "pocket-e2e-helper@example.com",
  other: "pocket-e2e-other@example.com",
  newcomer: "pocket-e2e-newcomer@example.com",
} as const

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are needed (.env.local)")
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError
  const existing = new Map(list.users.map((u) => [u.email, u.id]))

  if (process.argv.includes("--delete")) {
    for (const email of Object.values(E2E_USERS)) {
      const id = existing.get(email)
      if (!id) continue
      await admin.from("jobs").delete().eq("poster_id", id)
      await admin.auth.admin.deleteUser(id)
      console.log(`deleted ${email}`)
    }
    return
  }

  let password = process.env.E2E_PASSWORD
  if (!password) {
    password = randomBytes(18).toString("base64url")
    writeFileSync(".env.test.local", `# End-to-end test accounts (scripts/e2e-users.ts). Not a secret worth protecting, but not committed.\nE2E_PASSWORD=${password}\n`)
  }

  for (const [role, email] of Object.entries(E2E_USERS)) {
    const id = existing.get(email)
    if (id) {
      // Reset: fresh profile state so every test run starts from onboarding.
      await admin.from("jobs").delete().eq("poster_id", id)
      await admin.auth.admin.deleteUser(id)
    }
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `E2E ${role}` },
    })
    if (error) throw error
    console.log(`ready: ${email}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
