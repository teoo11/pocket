import type Stripe from "stripe"

import { firstTimeEvent, markEventHandled, syncAccount } from "@/features/payments/stripe-sync"
import { serverEnv } from "@/lib/env"
import { getStripe } from "@/lib/stripe"

/**
 * Connected-account events (helpers' Express accounts): account.updated turns card payments on or off.
 * Endpoint in the Stripe dashboard ("Events on connected accounts"): <site>/api/stripe/connect-webhook,
 * secret in STRIPE_CONNECT_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = serverEnv().STRIPE_CONNECT_WEBHOOK_SECRET
  if (!secret) return new Response("Webhook not configured", { status: 503 })
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret)
  } catch {
    return new Response("Bad signature", { status: 400 })
  }
  if (!(await firstTimeEvent(event))) return Response.json({ received: true, duplicate: true })
  if (event.type === "account.updated") await syncAccount(event.data.object)
  await markEventHandled(event)
  return Response.json({ received: true })
}
