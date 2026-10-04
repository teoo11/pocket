import { type NextRequest, NextResponse } from "next/server"

import { syncCheckoutSession } from "@/features/payments/stripe-sync"
import { getStripe, stripeEnabled } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

const UUID = /^[0-9a-f-]{36}$/i

/**
 * Back from Stripe Checkout (paid or cancelled). Records the result now instead of waiting for the webhook,
 * frees the half when the poster cancelled, then returns to the job.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const jobId = url.searchParams.get("job") ?? ""
  const sessionId = url.searchParams.get("session_id") ?? ""
  const back = new URL(UUID.test(jobId) ? `/jobs/${jobId}` : "/my-jobs", url.origin)
  if (!stripeEnabled() || !sessionId.startsWith("cs_")) return NextResponse.redirect(back)

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const stripe = getStripe()
  let session = await stripe.checkout.sessions.retrieve(sessionId)
  // Only the person who started it may cancel it.
  if (session.metadata?.payer_id !== claims?.claims.sub) return NextResponse.redirect(back)
  if (url.searchParams.has("cancelled") && session.status === "open") session = await stripe.checkout.sessions.expire(sessionId)
  const result = await syncCheckoutSession(session)
  back.searchParams.set("card", result === "paid" ? "paid" : result === "closed" ? "cancelled" : "processing")
  return NextResponse.redirect(back)
}
