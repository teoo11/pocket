import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { getFeed } from "@/features/jobs/queries"
import { JobsMap } from "@/features/maps/components/jobs-map"
import { MapsProvider } from "@/features/maps/components/maps-provider"
import { DEFAULT_CENTER } from "@/features/maps/places"
import { requireViewer } from "@/features/profiles/queries"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("map"))("title") }
}

export default async function MapPage() {
  const viewer = await requireViewer()
  const [jobs, t] = await Promise.all([getFeed(viewer.id, { sort: "near", limit: 300 }), getTranslations()])
  const home =
    viewer.private.home_lat != null && viewer.private.home_lng != null
      ? { lat: viewer.private.home_lat, lng: viewer.private.home_lng }
      : DEFAULT_CENTER

  return (
    <Page wide className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="flex min-h-12 items-center gap-1.5 font-semibold text-muted-foreground no-underline">
          <ArrowLeft className="size-5" aria-hidden />
          {t("common.back")}
        </Link>
        <h1 className="text-[1.5rem]">{t("map.title")}</h1>
      </div>
      <MapsProvider>
        <JobsMap jobs={jobs} home={home} />
      </MapsProvider>
      <p className="text-[0.9375rem] text-muted-foreground">{t("map.note")}</p>
    </Page>
  )
}
