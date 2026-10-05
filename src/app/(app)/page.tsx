import { Bell, ChevronRight, Plus, Trophy } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { Button } from "@/components/ui/button"
import { EmptyState, JobCard, JobGrid } from "@/features/jobs/components/job-bits"
import { JobSearch } from "@/features/jobs/components/job-search"
import { statusLine } from "@/features/jobs/lifecycle"
import { getSearchOrigin } from "@/features/jobs/origin"
import { getMyJobs, needsYouCount, searchJobCounts, searchJobs } from "@/features/jobs/queries"
import { activeFilters, MAX_RESULTS, PAGE_SIZE, parseSearch, searchHref } from "@/features/jobs/search-params"
import { Medal } from "@/features/leaderboard/components/medal"
import { currentMonth, getLeaderboard } from "@/features/leaderboard/queries"
import { JobsMapView } from "@/features/maps/components/jobs-map-view"
import { DEFAULT_CENTER } from "@/features/maps/places"
import { requireViewer } from "@/features/profiles/queries"

/** Home: what needs you, the month's top helpers, then the job search (list or map) under them. */
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const viewer = await requireViewer()
  const state = parseSearch(await searchParams)
  const origin = await getSearchOrigin()
  // The map shows every match (up to the maximum); the list shows a page at a time.
  const query = state.view === "map" ? { ...state, limit: MAX_RESULTS } : state

  const [t, results, counts, top, my] = await Promise.all([
    getTranslations(),
    searchJobs(query, origin),
    searchJobCounts(state, origin),
    getLeaderboard(currentMonth(), "points", 3),
    getMyJobs(viewer.id),
  ])
  const needsYou = needsYouCount(my)
  const total = state.cat === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[state.cat] ?? 0)
  const narrowed = !!state.q || state.cat !== "all" || activeFilters(state).length > 0
  const home = viewer.private.home_lat != null && viewer.private.home_lng != null ? { lat: viewer.private.home_lat, lng: viewer.private.home_lng } : DEFAULT_CENTER

  return (
    <Page wide>
      <h1 className="sr-only">{t("home.title")}</h1>

      {needsYou ? (
        <Link href="/my-jobs" className="flex gap-3 rounded-2xl bg-sun-soft px-4 py-3.5 text-sun-text no-underline">
          <Bell className="mt-0.5 size-[1.375rem] shrink-0" strokeWidth={1.7} aria-hidden />
          <span>
            <strong className="block">{t("home.needsYou", { count: needsYou })}</strong>
            {t("home.needsYouHint")}
          </span>
        </Link>
      ) : null}

      {top.length ? (
        <Link
          href="/top"
          className="relative flex flex-col gap-2 rounded-[1.25rem] border-[1.6px] border-border bg-card py-3.5 pr-12 pl-4 text-foreground no-underline"
        >
          <span className="flex items-center gap-2 font-extrabold text-brand-text">
            <Trophy className="size-[1.125rem]" strokeWidth={1.7} aria-hidden />
            {t("home.topHelpers")}
          </span>
          <span className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[0.96875rem] text-muted-foreground">
            {top.map((r, i) => (
              <span key={r.user_id} className="flex items-center gap-1.5 font-semibold whitespace-nowrap">
                <Medal rank={i + 1} size="sm" />
                {r.display_name}
              </span>
            ))}
          </span>
          <ChevronRight className="absolute top-1/2 right-4 size-5 -translate-y-1/2" aria-hidden />
        </Link>
      ) : null}

      <JobSearch key={state.q} state={state} counts={counts} nearMe={!!origin} />

      <p className="-mt-2 font-semibold" aria-live="polite">
        {t("search.count", { count: total })}
      </p>

      {results.length === 0 ? (
        narrowed ? (
          <EmptyState title={t("search.emptyTitle")} body={t("search.emptyBody")}>
            <Button asChild variant="outline">
              <Link href={searchHref(state, { q: "", cat: "all", dist: 0, minPay: 0, when: "any", examples: true })}>{t("search.clearAll")}</Link>
            </Button>
          </EmptyState>
        ) : (
          <EmptyState title={t("home.emptyTitle")} body={t("home.emptyBody")}>
            <Button asChild>
              <Link href="/post">
                <Plus aria-hidden />
                {t("nav.postJob")}
              </Link>
            </Button>
          </EmptyState>
        )
      ) : state.view === "map" ? (
        <JobsMapView jobs={results} origin={origin ?? home} nearMe={!!origin} />
      ) : (
        <>
          <JobGrid>
            {results.map((j) => (
              <JobCard key={j.id} job={j} status={statusLine(j, my.contextFor(j.id))} />
            ))}
          </JobGrid>
          {results.length === state.limit && state.limit < MAX_RESULTS ? (
            <Button asChild variant="outline" size="lg" className="self-center">
              <Link href={searchHref(state, { limit: state.limit + PAGE_SIZE })} scroll={false}>
                {t("search.showMore")}
              </Link>
            </Button>
          ) : null}
        </>
      )}
    </Page>
  )
}
