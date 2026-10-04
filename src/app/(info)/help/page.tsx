import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Card } from "@/components/ui/card"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("help")
  return { title: t("title") }
}

const STEPS = ["1", "2", "3", "4"] as const

export default async function HelpPage() {
  const t = await getTranslations("help")
  const b = (chunks: React.ReactNode) => <b>{chunks}</b>
  function link(href: string) {
    return function InlineLink(chunks: React.ReactNode) {
      return (
        <Link href={href} className="font-semibold text-brand-text">
          {chunks}
        </Link>
      )
    }
  }

  return (
    <>
      <h1 className="text-[1.75rem]">{t("title")}</h1>
      {(["getHelp", "giveHelp"] as const).map((side) => (
        <Card key={side} className="px-5">
          <h2 className="text-xl">{t(`${side}Title`)}</h2>
          <ol className="flex list-decimal flex-col gap-2.5 pl-6 marker:font-bold marker:text-brand-text">
            {STEPS.map((n) => (
              <li key={n}>{t.rich(`${side}.${n}`, { b })}</li>
            ))}
          </ol>
        </Card>
      ))}
      <Card className="px-5">
        <h2 className="text-xl">{t("minorsTitle")}</h2>
        <p>{t.rich("minorsBody", { link: link("/minors") })}</p>
      </Card>
      <Card className="px-5">
        <h2 className="text-xl">{t("personTitle")}</h2>
        <p>{t.rich("personBody", { link: link("/contact") })}</p>
      </Card>
      <Card className="px-5">
        <h2 className="text-xl">{t("textTitle")}</h2>
        <p>{t.rich("textBody", { b })}</p>
      </Card>
    </>
  )
}
