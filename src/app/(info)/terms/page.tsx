import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { TERMS } from "@/content/legal"
import { LegalPage } from "@/features/legal/legal-page"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("legal"))("termsTitle") }
}

export default async function TermsPage() {
  const t = await getTranslations("legal")
  return <LegalPage title={t("termsTitle")} sections={TERMS} />
}
