import { type NextRequest, NextResponse } from "next/server"

import { syncAccount } from "@/features/payments/stripe-sync"
import { getStripe, stripeEnabled } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/** Back from Stripe's account setup: read the account's state now (the webhook may be later), then go to Me. */
export async function GET(request: NextRequest) {
  const back = new URL("/me?payouts=back", request.nextUrl.origin)
  if (!stripeEnabled()) return NextResponse.redirect(back)
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims.sub
  if (!uid) return NextResponse.redirect(new URL("/login", request.nextUrl.origin))
  const { data } = await createAdminClient().from("payout_accounts").select("stripe_account_id").eq("user_id", uid).maybeSingle()
  if (data) await syncAccount(await getStripe().accounts.retrieve(data.stripe_account_id), uid)
  return NextResponse.redirect(back)
}
