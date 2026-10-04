import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PRIVACY } from "@/content/legal"
import { LegalPage } from "@/features/legal/legal-page"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("legal"))("privacyTitle") }
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal")
  return <LegalPage title={t("privacyTitle")} sections={PRIVACY} />
}
