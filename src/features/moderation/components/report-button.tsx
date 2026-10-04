"use client"

import { Flag, PhoneCall } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { createReport } from "../actions"
import { REPORT_REASONS, type ReportKind } from "../reasons"

/** "Report" / "Report a problem" / "Report this person": a reason, optional details, and the 112 note. */
export function ReportButton({
  kind,
  targetId,
  label,
  className,
  iconOnly = false,
}: {
  kind: ReportKind
  targetId?: string
  label: string
  className?: string
  /** A small flag button, with the label for screen readers and as a tooltip. */
  iconOnly?: boolean
}) {
  const detailsId = useId()
  const t = useTranslations("report")
  const tErr = useTranslations("errors")
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>("")
  const [details, setDetails] = useState("")
  const [pending, startTransition] = useTransition()

  const send = () =>
    startTransition(async () => {
      const r = await createReport({ kind, targetId, reason, details })
      if (!r.ok) {
        toast.error(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
        return
      }
      toast.success(t("sent"))
      setOpen(false)
      setReason("")
      setDetails("")
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className={cn("text-muted-foreground", className)} aria-label={label} title={label}>
            <Flag aria-hidden />
          </Button>
        ) : (
          <Button variant="quiet" className={cn("self-start", className)}>
            <Flag aria-hidden />
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(`title.${kind}`)}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 rounded-2xl bg-coral-soft px-4 py-3 text-coral-text">
          <PhoneCall className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            {t.rich("danger", {
              b: (c) => (
                <a href="tel:112" className="font-extrabold text-coral-text underline">
                  {c}
                </a>
              ),
            })}
          </span>
        </div>
        <div role="radiogroup" aria-label={t("reasonLabel")} className="flex flex-col gap-2">
          {REPORT_REASONS[kind].map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={reason === r}
              onClick={() => setReason(r)}
              className={cn(
                "min-h-[3.375rem] rounded-lg border-[1.6px] border-input bg-card px-4 text-left font-semibold",
                reason === r && "border-primary bg-brand-soft text-brand-text",
              )}
            >
              {t(`reasons.${r}`)}
            </button>
          ))}
        </div>
        <label htmlFor={detailsId} className="font-semibold">
          {t("detailsLabel")}
        </label>
        <Textarea id={detailsId} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
        <Button size="lg" disabled={!reason || pending} onClick={send}>
          {t("send")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
