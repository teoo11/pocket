import "server-only"

import type Stripe from "stripe"

import { getStripe, siteUrl } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Brings the database in line with Stripe. Used by the webhooks and by the return pages (in case the webhook
 * is late). Every call is idempotent, so the same event or page can arrive any number of times.
 */
export async function syncCheckoutSession(session: Stripe.Checkout.Session): Promise<"paid" | "closed" | "open"> {
  const admin = createAdminClient()
  if (session.status === "complete" && session.payment_status === "paid") {
    const intent = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? "")
    const { error } = await admin.rpc("card_payment_succeeded", { p_session_id: session.id, p_payment_intent: intent })
    if (error) throw error
    return "paid"
  }
  if (session.status === "expired") {
    const { error } = await admin.rpc("card_payment_closed", { p_session_id: session.id, p_status: "canceled" })
    if (error) throw error
    return "closed"
  }
  return "open"
}

export async function failCheckoutSession(sessionId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc("card_payment_closed", { p_session_id: sessionId, p_status: "failed" })
  if (error) throw error
}

/** A helper can receive cards once Stripe has turned on transfers and payouts for their account. */
export async function syncAccount(account: Stripe.Account, userId?: string): Promise<void> {
  const admin = createAdminClient()
  let owner = userId ?? (account.metadata?.user_id || null)
  if (!owner) {
    const { data } = await admin.rpc("payout_account_owner", { p_account_id: account.id })
    owner = data ?? null
  }
  if (!owner) return
  const { error } = await admin.rpc("sync_payout_account", {
    p_user_id: owner,
    p_account_id: account.id,
    p_transfers_active: account.capabilities?.transfers === "active",
    p_payouts_enabled: account.payouts_enabled ?? false,
    p_details_submitted: account.details_submitted ?? false,
  })
  if (error) throw error
}

/** Records an event as handled; false when it was handled before (Stripe retries and duplicates). */
export async function firstTimeEvent(event: Stripe.Event): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from("stripe_events").select("id").eq("id", event.id).maybeSingle()
  return !data
}

export async function markEventHandled(event: Stripe.Event): Promise<void> {
  const admin = createAdminClient()
  await admin.from("stripe_events").upsert({ id: event.id, type: event.type }, { onConflict: "id", ignoreDuplicates: true })
}

/** Stripe's hosted setup for a helper's account. Server only: never expose it as a server action. */
export async function onboardingLink(accountId: string): Promise<string> {
  const link = await getStripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${siteUrl()}/payments/connect/refresh`,
    return_url: `${siteUrl()}/payments/connect/return`,
  })
  return link.url
}
