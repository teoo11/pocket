import { ChevronDown, Shield } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Banner } from "@/components/banner"
import { Card } from "@/components/ui/card"
import { MINORS_LAW, type LawSection } from "@/content/minors-law"
import type { Locale } from "@/i18n/config"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("minors")
  return { title: t("title") }
}

const SHORT_KEYS = ["under15", "from15", "under18", "hours", "crime"] as const

function LawText({ sections }: { sections: LawSection[] }) {
  return sections.map((s) => (
    <section key={s.heading} className="flex flex-col gap-1.5">
      <h3 className="mt-2 text-base">{s.heading}</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        {s.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  ))
}

export default async function MinorsPage() {
  const t = await getTranslations("minors")
  const locale = (await getLocale()) as Locale
  const other: Locale = locale === "ro" ? "en" : "ro"
  const b = (chunks: React.ReactNode) => <b>{chunks}</b>

  return (
    <>
      <h1 className="text-[1.75rem]">{t("title")}</h1>
      <Banner tone="sun" icon={Shield} title={t("bannerTitle")}>
        {t("bannerBody")}
      </Banner>

      <Card className="px-5">
        <h2 className="text-xl">{t("shortTitle")}</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {SHORT_KEYS.map((k) => (
            <li key={k}>{t.rich(`short.${k}`, { b })}</li>
          ))}
        </ul>
      </Card>

      <Card className="px-5">
        <div>
          <h2 className="text-xl">{t("lawTitle")}</h2>
          <p className="text-muted-foreground">{t("lawSource")}</p>
        </div>
        <LawText sections={MINORS_LAW[locale]} />
        <details className="group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-1.5 font-semibold text-muted-foreground">
            <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
            {t("otherLanguage")}
          </summary>
          <div lang={other} className="flex flex-col gap-1.5">
            <LawText sections={MINORS_LAW[other]} />
          </div>
        </details>
      </Card>

      <p className="text-[0.9375rem] text-muted-foreground">
        {t.rich("disclaimer", {
          link: (chunks) => (
            <Link href="/contact" className="font-semibold text-brand-text">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </>
  )
}
