import { FileText } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"

import { Banner } from "@/components/banner"
import { Card } from "@/components/ui/card"
import { LEGAL } from "@/config/pocket"
import type { LegalSection } from "@/content/legal"
import type { Locale } from "@/i18n/config"
import { intlLocale } from "@/lib/format"

/** Privacy notice and terms: sections in the viewer's language, the operator, and the draft note until reviewed. */
export async function LegalPage({ title, sections }: { title: string; sections: Record<Locale, LegalSection[]> }) {
  const t = await getTranslations("legal")
  const locale = (await getLocale()) as Locale
  return (
    <>
      <h1 className="text-[1.75rem]">{title}</h1>
      <p className="-mt-3 text-muted-foreground">{t("updated", {
          date: new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
            new Date(LEGAL.updated),
          ),
        })}</p>
      {LEGAL.draft ? (
        <Banner tone="sun" icon={FileText} title={t("draftTitle")}>
          {t("draftBody")}
        </Banner>
      ) : null}
      <Card className="gap-5 px-5">
        {sections[locale].map((s) => (
          <section key={s.heading} className="flex flex-col gap-2">
            <h2 className="text-xl">{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </Card>
      <p className="text-[0.9375rem] text-muted-foreground">
        {LEGAL.operator} · {LEGAL.address} · {LEGAL.registration} ·{" "}
        <a href={`mailto:${LEGAL.privacyEmail}`} className="font-semibold">
          {LEGAL.privacyEmail}
        </a>
      </p>
    </>
  )
}
