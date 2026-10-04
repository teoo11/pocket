"use client"

import { CheckCircle2, Clock, Hand, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarFeedback } from "@/components/watermelon/quick-feedback"
import { jobPoints } from "@/features/gamification/levels"
import { HELPER_TAGS, POSTER_TAGS } from "@/features/reviews/tags"
import { fmtDur } from "@/lib/format"
import type { ActionResult } from "@/lib/rpc-errors"
import { useBroadcast } from "@/lib/realtime"
import { cn } from "@/lib/utils"

import * as actions from "../actions"

/** Runs a server action, shows a translated error, and refreshes the page on success. */
function useRun() {
  const tErr = useTranslations("errors")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const run = (fn: () => Promise<ActionResult>, success?: string, after?: () => void) =>
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) {
        toast.error(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
        if (r.error === "invalid_state") router.refresh()
        return
      }
      if (success) toast.success(success)
      after?.()
      router.refresh()
    })
  return { pending, run }
}

/** Re-reads the page when the job changes (an offer, a pick, a payment…), via the job:<id> channel. */
export function JobLiveRefresh({ jobId }: { jobId: string }) {
  const router = useRouter()
  useBroadcast(
    `job:${jobId}`,
    "job_changed",
    () => router.refresh(),
    () => router.refresh(),
  )
  return null
}

export function OfferButton({ jobId }: { jobId: string }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  return (
    <Button size="lg" className="w-full" disabled={pending} onClick={() => run(() => actions.makeOffer(jobId), t("offered"))}>
      <Hand aria-hidden />
      {t("offer")}
    </Button>
  )
}

export function WithdrawButton({ jobId }: { jobId: string }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  return (
    <Button variant="quiet" className="self-start" disabled={pending} onClick={() => run(() => actions.withdrawOffer(jobId), t("withdrawn"))}>
      {t("withdraw")}
    </Button>
  )
}

export function PickButton({ jobId, offerId, name }: { jobId: string; offerId: string; name: string }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  return (
    <Button disabled={pending} onClick={() => run(() => actions.pickHelper(jobId, offerId), t("pickedToast", { name }))}>
      {t("pick")}
    </Button>
  )
}

export function CancelJobButton({ jobId, matched }: { jobId: string; matched: boolean }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="quiet" className="self-start">
          <Trash2 aria-hidden />
          {t("cancel")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancelTitle")}</DialogTitle>
          <DialogDescription>{matched ? t("cancelBodyMatched") : t("cancelBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">{t("keep")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => actions.cancelJob(jobId), t("cancelled"), () => setOpen(false))}
          >
            {t("cancelConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function StartButton({ jobId }: { jobId: string }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  return (
    <Button size="lg" className="w-full" disabled={pending} onClick={() => run(() => actions.startJob(jobId), t("startedToast"))}>
      <Clock aria-hidden />
      {t("start")}
    </Button>
  )
}

/** "Job completed! How long did it take?": the planned time, the time since start, or typed minutes. */
export function FinishDialog({ jobId, plannedMin, startedAt, posterName }: { jobId: string; plannedMin: number; startedAt: string | null; posterName: string }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  // Measured when the dialog opens (an event, not render), so it reads the clock once per opening.
  const [measured, setMeasured] = useState<number | null>(null)
  const options: { minutes: number; label: string }[] = [{ minutes: plannedMin, label: t("finishPlanned", { dur: fmtDur(plannedMin) }) }]
  if (measured && measured !== plannedMin) options.push({ minutes: measured, label: t("finishMeasured", { dur: fmtDur(measured) }) })
  const finish = (minutes: number) => run(() => actions.finishJob(jobId, minutes), t("finishedToast"), () => setOpen(false))
  const typedMin = Math.round(Number(typed))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && startedAt) setMeasured(Math.min(600, Math.max(1, Math.round((Date.now() - Date.parse(startedAt)) / 60000))))
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <CheckCircle2 aria-hidden />
          {t("finish")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("finishTitle")}</DialogTitle>
          <DialogDescription>{t("finishBody", { name: posterName })}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5">
          {options.map((o) => (
            <Button key={o.minutes} variant="outline" size="lg" className="h-auto min-h-15 justify-between py-2 whitespace-normal" disabled={pending} onClick={() => finish(o.minutes)}>
              <span className="text-left">{o.label}</span>
              <span className="shrink-0 text-brand-text">{t("points", { count: jobPoints(o.minutes) })}</span>
            </Button>
          ))}
          <label htmlFor="finish-minutes" className="mt-2 font-semibold">
            {t("finishTyped")}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="finish-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                placeholder={String(plannedMin)}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="pr-14"
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-faint">min</span>
            </div>
            <Button disabled={pending || !(typedMin >= 1 && typedMin <= 600)} onClick={() => finish(typedMin)}>
              {t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ConfirmButton({ jobId }: { jobId: string }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  return (
    <Button size="lg" className="w-full" disabled={pending} onClick={() => run(() => actions.confirmJob(jobId), t("confirmedToast"))}>
      {t("confirm")}
    </Button>
  )
}

/** "Payment 1 of 2 / 2 of 2". Phase 1: cash only (card comes with Stripe). */
export function PayCashButton({ jobId, part, amountLei }: { jobId: string; part: 1 | 2; amountLei: number }) {
  const t = useTranslations("job")
  const { pending, run } = useRun()
  return (
    <Button size="lg" className="w-full" disabled={pending} onClick={() => run(() => actions.payCash(jobId, part), t("paidToast"))}>
      {t("paidCash", { amount: amountLei })}
    </Button>
  )
}

/** Stars (Quick Feedback with Undo), tags and an optional comment. `subjectRole`: the person being reviewed. */
export function ReviewForm({ jobId, subjectRole, name }: { jobId: string; subjectRole: "helper" | "poster"; name: string }) {
  const t = useTranslations("review")
  const { pending, run } = useRun()
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const options = subjectRole === "helper" ? HELPER_TAGS : POSTER_TAGS

  return (
    <div className="flex flex-col gap-4 rounded-3xl border-[1.6px] border-border bg-card p-5 shadow-wm-xs">
      <h2 className="text-xl">{t("title", { name })}</h2>
      <StarFeedback
        value={stars}
        onChange={setStars}
        labels={[t("words.1"), t("words.2"), t("words.3"), t("words.4"), t("words.5")]}
        undoLabel={t("undo")}
        groupLabel={t("starsLabel")}
        starLabel={(n) => t("starN", { count: n })}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("tagsLabel")}>
        {options.map((tag) => {
          const on = tags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => setTags((cur) => (on ? cur.filter((x) => x !== tag) : [...cur, tag]))}
              className={cn(
                "min-h-11 rounded-full border-[1.6px] border-input px-4 font-semibold",
                on && "border-primary bg-brand-soft text-brand-text",
              )}
            >
              {t(`tags.${tag}`)}
            </button>
          )
        })}
      </div>
      <label htmlFor="review-comment" className="font-semibold">
        {t("commentLabel")}
      </label>
      <Textarea id="review-comment" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("commentPlaceholder")} />
      <p className="text-[0.9375rem] text-muted-foreground">{t("blindNote", { name })}</p>
      <Button
        size="lg"
        disabled={pending || stars === 0}
        onClick={() => run(() => actions.submitReview({ jobId, stars, tags, comment }), t("thanks"))}
      >
        {t("send")}
      </Button>
    </div>
  )
}
