"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { markLevelSeen } from "@/features/profiles/actions"

import { levelOf } from "../levels"
import { useLevelName } from "./levels-table"

const CONFETTI_COLOURS = ["#B5705A", "#E8B66B", "#D98C80", "#8FA9BF", "#B08AA6", "#A9BF96"]

/**
 * Shown once when the viewer's points reach a level above the last one they saw (profile_private.last_seen_level).
 * The level is saved as seen as soon as the dialog opens, so it never shows twice, even if it is dismissed.
 */
export function LevelUpDialog({ points, lastSeen }: { points: number; lastSeen: number }) {
  const t = useTranslations("levelUp")
  const name = useLevelName()
  const level = levelOf(points)
  const [open, setOpen] = useState(level.n > lastSeen)

  useEffect(() => {
    if (level.n <= lastSeen) return
    void markLevelSeen(level.n)
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    void import("canvas-confetti").then(({ default: confetti }) =>
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.35 }, colors: CONFETTI_COLOURS, zIndex: 100 }),
    )
  }, [level.n, lastSeen])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col items-center gap-4 text-center" showCloseButton={false}>
        <span className="text-sm font-bold tracking-wide text-muted-foreground uppercase">{t("label")}</span>
        <span className="flex size-24 flex-col items-center justify-center rounded-3xl bg-brand-soft text-brand-text">
          <small className="text-xs font-bold tracking-wide uppercase">{t("level")}</small>
          <span className="text-4xl leading-none font-extrabold">{level.n}</span>
        </span>
        <DialogTitle className="text-2xl">{name(level.n)}</DialogTitle>
        <DialogDescription className="text-base">
          {t("next", { n: level.n + 1, name: name(level.n + 1), points: level.next, count: level.toGo })}
        </DialogDescription>
        <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
          {t("great")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
