import { SearchX } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"

export default async function NotFound() {
  const t = await getTranslations("errorPages")
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <SearchX className="size-12 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <h1 className="text-[1.75rem]">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild size="lg">
        <Link href="/">{t("home")}</Link>
      </Button>
    </main>
  )
}
