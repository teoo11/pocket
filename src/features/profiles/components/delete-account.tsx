"use client"

import { Download, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { deleteMyAccount } from "../account-actions"

/** "Your data": download everything as a file, or delete the account (with a clear confirmation). */
export function YourData() {
  const t = useTranslations("account")
  const tErr = useTranslations("errors")
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <section className="flex flex-col gap-3 rounded-3xl border-[1.6px] border-border bg-card p-5 shadow-wm-xs">
      <h2 className="text-xl">{t("title")}</h2>
      <p className="text-muted-foreground">{t("body")}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          {/* A plain link: the browser downloads the file. */}
          <a href="/me/export" download>
            <Download aria-hidden />
            {t("download")}
          </a>
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="quiet" className="text-destructive">
              <Trash2 aria-hidden />
              {t("delete")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirmTitle")}</DialogTitle>
              <DialogDescription>{t("confirmBody")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("keep")}
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteMyAccount({ confirm: true })
                    // On success the action redirects to the log-in page.
                    if (r && !r.ok) toast.error(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
                  })
                }
              >
                {t("confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
