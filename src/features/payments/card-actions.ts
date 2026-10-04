"use server"

import { getLocale } from "next-intl/server"
import { z } from "zod"

import { type ActionResult, rpcErrorKey } from "@/lib/rpc-errors"
import { feePercent, getStripe, siteUrl, stripeEnabled } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import { onboardingLink, syncAccount, syncCheckoutSession } from "./stripe-sync"

/** The signed-in person's id and email, from the verified session. */
async function me(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const id = data?.claims.sub
  return id ? { id, email: typeof data.claims.email === "string" ? data.claims.email : null } : null
}

const partSchema = z.object({ jobId: z.uuid(), part: z.union([z.literal(1), z.literal(2)]) })

/**
 * Pay one half by card: the database checks the job and reserves the half, then Stripe Checkout takes the
 * payment for the helper's account (destination charge), minus Pocket's fee. Returns the Checkout URL.
 */
export async function startCardPayment(input: z.input<typeof partSchema>): Promise<ActionResult<string>> {
  const parsed = partSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  if (!stripeEnabled()) return { ok: false, error: "card_unavailable" }
  const user = await me()
  if (!user) return { ok: false, error: "not_signed_in" }
  const { jobId, part } = parsed.data

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("begin_card_payment", {
    p_user_id: user.id,
    p_job_id: jobId,
    p_part: part,
    p_fee_percent: feePercent(),
  })
  if (error || !data?.[0]) return { ok: false, error: rpcErrorKey(error) }
  const pay = data[0]

  try {
    const locale = await getLocale()
    const back = `${siteUrl()}/payments/checkout/return?job=${jobId}&session_id={CHECKOUT_SESSION_ID}`
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        locale: locale === "ro" ? "ro" : "en",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "ron",
              unit_amount: pay.amount_bani,
              product_data: { name: `${pay.job_title} · ${part === 1 ? "1/2" : "2/2"}` },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: pay.fee_bani > 0 ? pay.fee_bani : undefined,
          transfer_data: { destination: pay.destination },
          metadata: { payment_id: pay.payment_id, job_id: jobId, part: String(part) },
        },
        client_reference_id: pay.payment_id,
        metadata: { payment_id: pay.payment_id, job_id: jobId, payer_id: user.id },
        customer_email: user.email ?? undefined,
        success_url: back,
        cancel_url: `${back}&cancelled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      { idempotencyKey: `checkout:${pay.payment_id}` },
    )
    await admin.rpc("attach_checkout_session", { p_payment_id: pay.payment_id, p_session_id: session.id })
    if (!session.url) throw new Error("Checkout session without a URL")
    return { ok: true, data: session.url }
  } catch (e) {
    console.error("[stripe] checkout failed", e)
    // Free the half again so the poster can retry, or pay cash.
    await admin.from("payments").update({ status: "failed" }).eq("id", pay.payment_id).eq("status", "pending")
    return { ok: false, error: "card_unavailable" }
  }
}

/** Gives up a card payment that was started but not finished (the half can then be paid again). */
export async function cancelCardPayment(input: z.input<typeof partSchema>): Promise<ActionResult> {
  const parsed = partSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  if (!stripeEnabled()) return { ok: false, error: "card_unavailable" }
  const user = await me()
  if (!user) return { ok: false, error: "not_signed_in" }
  const admin = createAdminClient()
  const { data: sessionId } = await admin.rpc("pending_card_session", {
    p_user_id: user.id,
    p_job_id: parsed.data.jobId,
    p_part: parsed.data.part,
  })
  if (!sessionId) return { ok: true }
  const stripe = getStripe()
  let session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.status === "open") session = await stripe.checkout.sessions.expire(sessionId)
  // If it was paid in the meantime, this records the payment instead.
  await syncCheckoutSession(session)
  return { ok: true }
}

/** "Get paid by card": creates the helper's Stripe Express account once, then sends them to Stripe's setup. */
export async function setUpCardPayouts(): Promise<ActionResult<string>> {
  if (!stripeEnabled()) return { ok: false, error: "card_unavailable" }
  const user = await me()
  if (!user) return { ok: false, error: "not_signed_in" }
  const admin = createAdminClient()
  const stripe = getStripe()
  const { data: existing } = await admin.from("payout_accounts").select("stripe_account_id").eq("user_id", user.id).maybeSingle()
  let accountId = existing?.stripe_account_id
  if (!accountId) {
    const account = await stripe.accounts.create(
      {
        type: "express",
        country: "RO",
        email: user.email ?? undefined,
        business_type: "individual",
        capabilities: { transfers: { requested: true } },
        metadata: { user_id: user.id },
      },
      { idempotencyKey: `account:${user.id}` },
    )
    await syncAccount(account, user.id)
    accountId = account.id
  }
  return { ok: true, data: await onboardingLink(accountId) }
}

/** Stripe's own page for bank details and payout history (payouts are automatic; there is no withdraw button). */
export async function openPayoutDashboard(): Promise<ActionResult<string>> {
  if (!stripeEnabled()) return { ok: false, error: "card_unavailable" }
  const user = await me()
  if (!user) return { ok: false, error: "not_signed_in" }
  const admin = createAdminClient()
  const { data } = await admin.from("payout_accounts").select("stripe_account_id").eq("user_id", user.id).maybeSingle()
  if (!data) return { ok: false, error: "not_found" }
  const link = await getStripe().accounts.createLoginLink(data.stripe_account_id)
  return { ok: true, data: link.url }
}
