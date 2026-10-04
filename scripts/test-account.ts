/**
 * Creates a confirmed account for trying the app by hand. Unlike the E2E accounts it is never reset
 * by the tests. Running it again keeps the account and its data, and sets a new password.
 * The password is printed once and kept in .env.test.local (git-ignored).
 *
 *   npx tsx scripts/test-account.ts [email]
 */
import { randomBytes } from "node:crypto"
import { appendFileSync, existsSync, readFileSync } from "node:fs"

import { createClient } from "@supabase/supabase-js"

function loadEnv(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}
loadEnv(".env.local")

async function main() {
  const email = process.argv[2] ?? "pocket-test@example.com"
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are needed (.env.local)")
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError
  const user = list.users.find((u) => u.email === email)

  // Letters and digits only, so it is easy to type.
  const password = randomBytes(12).toString("base64url").replace(/[-_]/g, "x")
  const { error } = user
    ? await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true })
    : await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "Test" } })
  if (error) throw error

  appendFileSync(".env.test.local", `TEST_ACCOUNT=${email} ${password}\n`)
  console.log(`${user ? "reset" : "created"}: ${email}\npassword: ${password}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
