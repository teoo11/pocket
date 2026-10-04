import { Clock, Mail, Phone, PhoneCall } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Banner } from "@/components/banner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CONTACT } from "@/config/pocket"
import { ContactForm } from "@/features/moderation/components/contact-form"
import { getViewer } from "@/features/profiles/queries"
import type { Locale } from "@/i18n/config"
import { initial } from "@/lib/format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact")
  return { title: t("title") }
}

export default async function ContactPage() {
  const t = await getTranslations("contact")
  const locale = (await getLocale()) as Locale
  const viewer = await getViewer()

  return (
    <>
      <h1 className="text-[1.875rem]">{t("title")}</h1>
      <p className="text-lg text-muted-foreground">{t("lede")}</p>
      <Banner tone="coral" icon={PhoneCall} title={t("dangerTitle")}>
        {t.rich("dangerBody", {
          b: (c) => (
            <a href="tel:112" className="font-extrabold text-coral-text underline">
              {c}
            </a>
          ),
        })}
      </Banner>

      <section className="flex flex-col gap-3">
        <h2 className="text-[1.5rem]">{t("reps")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONTACT.reps.map((r) => (
            <Card key={r.email} className="px-5">
              <div className="flex items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft text-xl font-extrabold text-brand-text">{initial(r.name)}</span>
                <div className="min-w-0">
                  <b className="block text-lg">{r.name}</b>
                  <span className="block text-muted-foreground">{r.role}</span>
                  <span className="block tabular-nums">{r.phone}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="flex-1">
                  <a href={`tel:${r.phone.replace(/\s/g, "")}`}>
                    <Phone aria-hidden />
                    {t("call")}
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a href={`mailto:${r.email}?subject=Pocket`}>
                    <Mail aria-hidden />
                    {t("email")}
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          <Clock className="size-4" aria-hidden />
          {CONTACT.hours[locale]} · {t("reply", { when: CONTACT.reply[locale] })} · {CONTACT.email}
        </p>
      </section>

      <Card className="px-5">
        <h2 className="text-xl">{t("formTitle")}</h2>
        {viewer?.profile.onboarded_at ? (
          <ContactForm />
        ) : (
          <p>
            {t.rich("signInToWrite", {
              link: (c) => (
                <Link href="/login?next=/contact" className="font-bold text-brand-text">
                  {c}
                </Link>
              ),
            })}
          </p>
        )}
      </Card>
    </>
  )
}
