import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { OnboardingForm } from "@/features/profiles/components/onboarding-form"
import { getViewer } from "@/features/profiles/queries"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding")
  return { title: t("title") }
}

export default async function OnboardingPage() {
  const viewer = await getViewer()
  if (!viewer) redirect("/login?next=/onboarding")
  if (viewer.profile.onboarded_at) redirect("/")
  // The sign-up trigger's fallback name ("Neighbour") isn't worth pre-filling.
  const name = viewer.profile.display_name === "Neighbour" ? "" : viewer.profile.display_name
  return <OnboardingForm defaultName={name} />
}
