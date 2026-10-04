import "server-only"

import { createClient } from "@supabase/supabase-js"

import { serverEnv } from "@/lib/env"

import type { Database } from "./database.types"

/**
 * Service-role client: bypasses RLS. Server only, for work no user may do themselves
 * (Stripe webhooks, deleting an account, seeding). Never import it from a client component.
 */
export function createAdminClient() {
  const env = serverEnv()
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
