"use client"

import { CreditCard, ExternalLink } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { ActionResult } from "@/lib/rpc-errors"

import { openPayoutDashboard, setUpCardPayouts } from "../card-actions"

export type PayoutState = "soon" | "none" | "incomplete" | "active"

/** "Get paid by card" on Me: set up a Stripe account once; then Stripe's page for bank details and payouts. */
export function PayoutsCard({ state }: { state: PayoutState }) {
  const t = useTranslations("payouts")
  const tErr = useTranslations("errors")
  const [pending, startTransition] = useTransition()
  const go = (action: () => Promise<ActionResult<string>>) =>
    startTransition(async () => {
      const r = await action()
      if (!r.ok || !r.data) {
        toast.error(!r.ok && tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
        return
      }
      window.location.assign(r.data)
    })

  return (
    <section className="flex flex-col gap-3 rounded-3xl border-[1.6px] border-border bg-card p-5 shadow-wm-xs">
      <h2 className="flex items-center gap-2 text-xl">
        <CreditCard className="size-5" aria-hidden />
        {t("title")}
      </h2>
      <p className="text-muted-foreground">{t(`body.${state}`)}</p>
      {state === "active" ? (
        <Button variant="outline" disabled={pending} onClick={() => go(openPayoutDashboard)}>
          <ExternalLink aria-hidden />
          {t("dashboard")}
        </Button>
      ) : (
        <Button disabled={pending || state === "soon"} onClick={() => go(setUpCardPayouts)}>
          {state === "incomplete" ? t("finish") : t("setUp")}
        </Button>
      )}
    </section>
  )
}
