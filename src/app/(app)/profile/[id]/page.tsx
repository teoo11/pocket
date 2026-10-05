import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { ReportButton } from "@/features/moderation/components/report-button"
import { PublicProfile } from "@/features/profiles/components/public-profile"
import { getHistory, getPublicProfile, getReviewsAbout, requireViewer } from "@/features/profiles/queries"

export async function generateMetadata({ params }: PageProps<"/profile/[id]">): Promise<Metadata> {
  const p = await getPublicProfile((await params).id)
  return { title: p?.profile.display_name }
}

/** Someone's public profile. Your own lives on /me, with what's public and what's private side by side. */
export default async function ProfilePage({ params }: PageProps<"/profile/[id]">) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const viewer = await requireViewer()
  if (id === viewer.id) redirect("/me")
  const [data, history, reviews, t] = await Promise.all([getPublicProfile(id), getHistory(id), getReviewsAbout(id), getTranslations()])
  if (!data) notFound()

  return (
    <Page>
      <Link href="/" className="flex min-h-12 items-center gap-1.5 self-start font-semibold text-muted-foreground no-underline">
        <ArrowLeft className="size-5" aria-hidden />
        {t("common.back")}
      </Link>
      <PublicProfile data={data} history={history} reviews={reviews} />
      <ReportButton kind="user" targetId={id} label={t("report.person")} />
    </Page>
  )
}
