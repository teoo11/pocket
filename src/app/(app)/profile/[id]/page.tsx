import { ArrowLeft, History, Lock, Star } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { LevelCard } from "@/features/gamification/components/level-card"
import { jobPoints, levelOf } from "@/features/gamification/levels"
import type { CategoryKey } from "@/features/jobs/categories"
import { CategoryTile, EmptyState } from "@/features/jobs/components/job-bits"
import { Facts } from "@/features/jobs/components/job-details"
import { ReportButton } from "@/features/moderation/components/report-button"
import { getHistory, getPublicProfile, getReviewsAbout, requireViewer } from "@/features/profiles/queries"
import { ReviewCard, TagChips } from "@/features/reviews/components/review-card"
import { topTags } from "@/features/reviews/tags"
import { todayYmd } from "@/lib/dates"
import { dayLabel, fmtDur } from "@/lib/format"

export async function generateMetadata({ params }: PageProps<"/profile/[id]">): Promise<Metadata> {
  const p = await getPublicProfile((await params).id)
  return { title: p?.profile.display_name }
}

export default async function ProfilePage({ params }: PageProps<"/profile/[id]">) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const viewer = await requireViewer()
  const [data, history, reviews] = await Promise.all([getPublicProfile(id), getHistory(id), getReviewsAbout(id)])
  if (!data) notFound()
  const t = await getTranslations()
  const locale = await getLocale()
  const { profile, stats } = data
  const self = id === viewer.id
  const points = stats?.points ?? 0
  const knownFor = topTags(reviews)
  const level = levelOf(points)
  const levelName = level.n > 8 ? t("levels.legendN", { n: level.n - 7 }) : t(`levels.names.${level.n - 1}`)
  const today = todayYmd()
  const words = { today: t("time.today"), tomorrow: t("time.tomorrow"), yesterday: t("time.yesterday") }

  return (
    <Page>
      <Link href="/" className="flex min-h-12 items-center gap-1.5 self-start font-semibold text-muted-foreground no-underline">
        <ArrowLeft className="size-5" aria-hidden />
        {t("common.back")}
      </Link>
      <section className="flex items-center gap-4">
        <UserAvatar name={profile.display_name} path={profile.avatar_path} size="lg" tone={self ? "brand" : "sun"} />
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[1.875rem]">
            {profile.display_name}
            {self ? <span className="rounded-md bg-brand-soft px-2 text-sm font-bold text-brand-text">{t("profile.you")}</span> : null}
            {profile.is_example ? <span className="rounded-md bg-secondary px-2 text-sm font-bold text-muted-foreground">{t("common.example")}</span> : null}
          </h1>
          <p className="text-muted-foreground">
            {t("profile.levelLine", { n: level.n, name: levelName })}
            {profile.area_label ? ` · ${profile.area_label}` : ""}
          </p>
        </div>
      </section>
      {profile.bio ? <p className="text-lg italic">“{profile.bio}”</p> : null}
      <Facts
        items={[
          { label: t("profile.jobsDone"), value: stats?.jobs_done ?? 0 },
          { label: t("profile.timeHelping"), value: stats?.minutes ? fmtDur(stats.minutes) : "–" },
          { label: t("profile.points"), value: points },
          {
            label: t("profile.rating"),
            value: stats?.helper_rating ? (
              <>
                {Number(stats.helper_rating).toFixed(1)} ★ <small className="text-muted-foreground">({stats.helper_reviews})</small>
              </>
            ) : (
              t("job.new")
            ),
          },
          ...(stats?.poster_rating
            ? [
                {
                  label: t("profile.ratingAsPoster"),
                  value: (
                    <>
                      {Number(stats.poster_rating).toFixed(1)} ★ <small className="text-muted-foreground">({stats.poster_reviews})</small>
                    </>
                  ),
                },
              ]
            : []),
        ]}
      />
      {knownFor.length ? (
        <section className="flex flex-col gap-2" aria-labelledby="known-for">
          <h2 id="known-for" className="text-lg">
            {t("profile.knownFor")}
          </h2>
          <TagChips tags={knownFor.map((k) => k.tag)} counts={knownFor.map((k) => k.count)} />
        </section>
      ) : null}
      {self ? <LevelCard points={points} /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-[1.5rem]">
          <History className="size-5" aria-hidden />
          {t("profile.history")}
        </h2>
        {history.length ? (
          <ol className="flex flex-col gap-2">
            {history.map((j) => (
              <li key={j.id} className="flex items-start gap-3 border-[1.6px] border-border bg-card px-4 py-3">
                <CategoryTile category={(j.category ?? "other") as CategoryKey} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <b>{j.title}</b>
                  <span className="text-[0.9375rem] text-muted-foreground">
                    {t("profile.for", { name: j.poster_name ?? "" })} · {j.area_label}
                  </span>
                  <span className="text-[0.9375rem] text-muted-foreground">
                    {j.confirmed_at ? `${dayLabel(j.confirmed_at.slice(0, 10), today, locale, words)} · ` : ""}
                    {fmtDur(j.minutes ?? j.dur_min ?? 0)} · {t("job.points", { count: jobPoints(j.minutes ?? j.dur_min ?? 0) })}
                  </span>
                  {j.review?.tags?.length ? (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {j.review.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-secondary px-2 text-sm font-semibold text-muted-foreground">
                          {t(`review.tags.${tag}`)}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                {j.review ? (
                  <span className="font-extrabold whitespace-nowrap text-sun-text" aria-label={t("review.starN", { count: j.review.stars })}>
                    {j.review.stars} ★
                  </span>
                ) : j.status === "completed" ? (
                  <span className="text-sm text-muted-foreground">{t("profile.waitingPayment")}</span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title={t("profile.noHistory")} body={self ? t("profile.noHistorySelf") : t("profile.noHistoryOther", { name: profile.display_name.split(" ")[0] })} />
        )}
        {stats?.jobs_posted ? <p className="text-muted-foreground">{t("profile.alsoAsked", { count: stats.jobs_posted })}</p> : null}
      </section>

      {reviews.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-[1.5rem]">
            <Star className="size-5" aria-hidden />
            {t("profile.reviews")}
          </h2>
          <ul className="flex flex-col gap-2">
            {reviews.map((r) => (
              <li key={r.id}>
                <ReviewCard
                  review={r}
                  author={{ name: r.author?.display_name ?? null, avatarPath: r.author?.avatar_path ?? null }}
                  date={dayLabel(r.created_at.slice(0, 10), today, locale, words)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {self ? (
        <p className="flex items-center gap-1.5 text-[0.9375rem] text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          {t("profile.selfNote")}
        </p>
      ) : (
        <ReportButton kind="user" targetId={id} label={t("report.person")} />
      )}
    </Page>
  )
}
