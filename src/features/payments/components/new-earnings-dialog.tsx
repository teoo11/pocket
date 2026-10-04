"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

import { markEarningsSeen } from "../actions"

const CONFETTI_COLOURS = ["#B5705A", "#E8B66B", "#D98C80", "#8FA9BF", "#B08AA6", "#A9BF96"]

type Earning = { id: string; part: number; lei: number; title: string }

/** "+25 lei": shown once for payments received since the last time (the prototype's earnings pop-up). */
export function NewEarningsDialog({ earnings }: { earnings: Earning[] }) {
  const t = useTranslations("earningsPopup")
  const router = useRouter()
  const total = earnings.reduce((sum, e) => sum + e.lei, 0)
  const [open, setOpen] = useState(earnings.length > 0)

  useEffect(() => {
    if (!earnings.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    void import("canvas-confetti").then(({ default: confetti }) =>
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.35 }, colors: CONFETTI_COLOURS, zIndex: 100 }),
    )
  }, [earnings.length])

  const close = (next: boolean) => {
    setOpen(next)
    // Marked as seen on closing (a live refresh while open keeps it on screen), then a level-up can show.
    if (!next) void markEarningsSeen().then(() => router.refresh())
  }

  // Each job once, with which half was paid.
  const lines = [...new Map(earnings.map((e) => [`${e.title}-${e.part}`, e])).values()]

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex flex-col items-center gap-4 text-center" showCloseButton={false}>
        <span className="text-sm font-bold tracking-wide text-muted-foreground uppercase">{t("label")}</span>
        <DialogTitle className="text-5xl font-extrabold text-brand-text tabular-nums" aria-label={t("amount", { amount: total })}>
          +{total.toLocaleString("ro-RO", { maximumFractionDigits: 2 })} lei
        </DialogTitle>
        <DialogDescription className="text-base">
          {lines.map((e) => t("line", { title: e.title, part: e.part })).join(", ")}
        </DialogDescription>
        <span className="flex items-center gap-1.5 text-[0.9375rem] text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          {t("private")}
        </span>
        <Button size="lg" className="w-full" onClick={() => close(false)}>
          {t("nice")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
