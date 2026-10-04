"use client"

import { Banknote, CreditCard, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PayCashButton } from "@/features/jobs/components/job-actions"
import { cn } from "@/lib/utils"

import { cancelCardPayment, startCardPayment } from "../card-actions"

/** off: not paying now · soon: Pocket doesn't take cards yet (no Stripe key) · cashOnly: the helper can't receive cards. */
export type CardState = "off" | "soon" | "cashOnly" | "on"

/**
 * How the poster pays one half: cash (they confirm handing it over) or card (Stripe Checkout, straight to the
 * helper's account). Card shows only when Pocket takes cards; it is disabled when the helper can't receive them.
 */
export function PayChoice({
  jobId,
  part,
  amountLei,
  card,
  pendingCard,
  helperName,
}: {
  jobId: string
  part: 1 | 2
  amountLei: number
  card: CardState
  pendingCard: boolean
  helperName: string
}) {
  const t = useTranslations("pay")
  const tErr = useTranslations("errors")
  const router = useRouter()
  const [method, setMethod] = useState<"cash" | "card">("cash")
  const [pending, startTransition] = useTransition()

  const fail = (error: string) => toast.error(tErr.has(error) ? tErr(error) : tErr("unknown"))

  if (pendingCard) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-sky-soft px-4 py-3.5 text-sky-text">
        <span className="flex items-center gap-2 font-bold">
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          {t("inProgress")}
        </span>
        <span>{t("inProgressBody")}</span>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await cancelCardPayment({ jobId, part })
              if (!r.ok) fail(r.error)
              router.refresh()
            })
          }
        >
          {t("cancelCard")}
        </Button>
      </div>
    )
  }

  if (card === "off") return <PayCashButton jobId={jobId} part={part} amountLei={amountLei} />

  const option = (value: "cash" | "card", Icon: typeof Banknote, label: string, disabled = false) => (
    <button
      type="button"
      role="radio"
      aria-checked={method === value}
      disabled={disabled}
      onClick={() => setMethod(value)}
      className={cn(
        "flex min-h-[3.375rem] flex-1 items-center justify-center gap-2 rounded-lg border-[1.6px] border-input bg-card px-4 font-bold",
        method === value && "border-primary bg-brand-soft text-brand-text",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={t("how")} className="flex gap-2.5">
        {option("cash", Banknote, t("cash"))}
        {option("card", CreditCard, t("card"), card !== "on")}
      </div>
      {card === "cashOnly" ? <p className="text-[0.9375rem] text-muted-foreground">{t("cashOnly", { name: helperName })}</p> : null}
      {card === "soon" ? <p className="text-[0.9375rem] text-muted-foreground">{t("cardSoon")}</p> : null}
      {method === "cash" ? (
        <PayCashButton jobId={jobId} part={part} amountLei={amountLei} />
      ) : (
        <>
          <Button
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await startCardPayment({ jobId, part })
                if (r.ok && r.data) window.location.assign(r.data)
                else fail(r.ok ? "unknown" : r.error)
              })
            }
          >
            <CreditCard aria-hidden />
            {t("payByCard", { amount: amountLei })}
          </Button>
          <p className="text-[0.9375rem] text-muted-foreground">{t("cardNote", { name: helperName })}</p>
        </>
      )}
    </div>
  )
}
