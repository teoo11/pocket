"use client"

import { TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

/** Something broke while showing a page: say so plainly and offer to try again. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPages")
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlert className="size-12 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <h1 className="text-[1.75rem]">{t("errorTitle")}</h1>
      <p className="text-muted-foreground">{t("errorBody")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={reset}>
          {t("retry")}
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
      {error.digest ? <p className="text-sm text-faint">{t("code", { code: error.digest })}</p> : null}
    </main>
  )
}
