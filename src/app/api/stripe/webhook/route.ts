import type Stripe from "stripe"

import { failCheckoutSession, firstTimeEvent, markEventHandled, syncCheckoutSession } from "@/features/payments/stripe-sync"
import { serverEnv } from "@/lib/env"
import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Platform events (Stripe → Pocket): card payments finishing, failing, expiring, refunds.
 * Endpoint in the Stripe dashboard: <site>/api/stripe/webhook, secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response("Webhook not configured", { status: 503 })
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret)
  } catch {
    return new Response("Bad signature", { status: 400 })
  }
  if (!(await firstTimeEvent(event))) return Response.json({ received: true, duplicate: true })

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.expired":
      await syncCheckoutSession(event.data.object)
      break
    case "checkout.session.async_payment_failed":
      await failCheckoutSession(event.data.object.id)
      break
    case "charge.refunded": {
      const charge = event.data.object
      const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
      if (charge.refunded && intent) await createAdminClient().rpc("card_payment_refunded", { p_payment_intent: intent })
      break
    }
  }
  await markEventHandled(event)
  return Response.json({ received: true })
}
