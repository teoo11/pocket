import "server-only"

import { stripeEnabled } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

import type { PayoutState } from "./components/payouts-card"

/**
 * My earnings: payments I received (RLS: only payer and payee can read a payment).
 * What the helper got is amount minus Pocket's fee (card payments only; cash has no fee).
 */
export async function getMyEarnings(viewerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("payments")
    .select("id, job_id, part, method, amount_bani, fee_bani, succeeded_at, jobs(title)")
    .eq("payee_id", viewerId)
    .eq("status", "succeeded")
    .order("succeeded_at", { ascending: false })
  const rows = (data ?? []).map((p) => ({
    id: p.id,
    jobId: p.job_id,
    part: p.part,
    method: p.method,
    lei: (p.amount_bani - p.fee_bani) / 100,
    at: p.succeeded_at,
    title: (p.jobs as { title: string } | null)?.title ?? "",
  }))
  return { rows, total: rows.reduce((sum, r) => sum + r.lei, 0) }
}

/** Payments received since the helper last saw the "New earnings" pop-up. */
export async function getNewEarnings(viewerId: string, since: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("payments")
    .select("id, part, amount_bani, fee_bani, jobs(title)")
    .eq("payee_id", viewerId)
    .eq("status", "succeeded")
    .gt("succeeded_at", since)
    .order("succeeded_at")
  return (data ?? []).map((p) => ({
    id: p.id,
    part: p.part,
    lei: (p.amount_bani - p.fee_bani) / 100,
    title: (p.jobs as { title: string } | null)?.title ?? "",
  }))
}

/** "Get paid by card" state for Me ("soon" while Pocket doesn't take cards: no Stripe key yet). */
export async function getPayoutState(viewerId: string, acceptsCard: boolean): Promise<PayoutState> {
  if (!stripeEnabled()) return "soon"
  if (acceptsCard) return "active"
  const supabase = await createClient()
  const { data } = await supabase.from("payout_accounts").select("user_id").eq("user_id", viewerId).maybeSingle()
  return data ? "incomplete" : "none"
}
