import { type NextRequest, NextResponse } from "next/server"

import { onboardingLink } from "@/features/payments/stripe-sync"
import { stripeEnabled } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/** Stripe's setup link expired (or was opened twice): make a fresh one. */
export async function GET(request: NextRequest) {
  const me = new URL("/me", request.nextUrl.origin)
  if (!stripeEnabled()) return NextResponse.redirect(me)
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims.sub
  if (!uid) return NextResponse.redirect(new URL("/login", request.nextUrl.origin))
  const { data } = await createAdminClient().from("payout_accounts").select("stripe_account_id").eq("user_id", uid).maybeSingle()
  if (!data) return NextResponse.redirect(me)
  return NextResponse.redirect(await onboardingLink(data.stripe_account_id))
}
