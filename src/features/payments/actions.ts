"use server"

import { createClient } from "@/lib/supabase/server"

/** The "New earnings" pop-up was seen: only later payments show in it. */
export async function markEarningsSeen(): Promise<void> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims.sub
  if (!uid) return
  await supabase.from("profile_private").update({ earnings_seen_at: new Date().toISOString() }).eq("user_id", uid)
}
