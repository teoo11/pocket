import "server-only"

import { cache } from "react"

import { createClient } from "./server"

/**
 * The signed-in user's verified JWT claims, or null. Deduplicated per request.
 * Uses getClaims() (signature-checked), never getSession(), for anything that decides access.
 */
export const getClaims = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) return null
  return data.claims
})
