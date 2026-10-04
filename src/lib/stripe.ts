import "server-only"

import Stripe from "stripe"

import { serverEnv } from "@/lib/env"

let client: Stripe | null = null

/** Card payments are on only when the Stripe key is set; otherwise Pocket is cash only. */
export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export function getStripe(): Stripe {
  const key = serverEnv().STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  client ??= new Stripe(key, { appInfo: { name: "Pocket" } })
  return client
}

/** Pocket's fee on card payments, in percent (STRIPE_FEE_PERCENT, 0 by default). */
export function feePercent(): number {
  return serverEnv().STRIPE_FEE_PERCENT
}

export function siteUrl(): string {
  return serverEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
}
