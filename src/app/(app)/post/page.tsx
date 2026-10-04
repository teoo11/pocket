import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { DEFAULT_CENTER } from "@/features/maps/places"
import { PostWizardClient } from "@/features/jobs/post-wizard/client"
import { requireViewer } from "@/features/profiles/queries"
import { todayYmd } from "@/lib/dates"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav")
  return { title: t("postJob") }
}

export default async function PostPage() {
  const viewer = await requireViewer()
  const home = {
    lat: viewer.private.home_lat ?? DEFAULT_CENTER.lat,
    lng: viewer.private.home_lng ?? DEFAULT_CENTER.lng,
    label: viewer.private.home_label ?? viewer.profile.area_label ?? "",
  }
  return (
    <Page>
      <PostWizardClient today={todayYmd()} home={home} />
    </Page>
  )
}
