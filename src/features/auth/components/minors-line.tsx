import { Shield } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

/** "Under 18? Read the rules for minors · Contact us" under the sign-up and log-in cards. */
export async function MinorsLine() {
  const t = await getTranslations("auth")
  return (
    <p className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 text-center text-[0.9375rem] text-muted-foreground">
      <Shield className="size-4" aria-hidden />
      {t("under18")}
      <Link href="/minors" className="font-semibold text-brand-text">
        {t("readMinors")}
      </Link>
      ·
      <Link href="/contact" className="font-semibold text-brand-text">
        {t("contactUs")}
      </Link>
    </p>
  )
}
