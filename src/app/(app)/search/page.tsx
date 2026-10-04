import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { isCategory } from "@/features/jobs/categories"
import { EmptyState, JobCard, JobGrid } from "@/features/jobs/components/job-bits"
import { SEARCH_DEFAULTS, SearchControls, type SearchState } from "@/features/jobs/components/search-controls"
import { statusLine } from "@/features/jobs/lifecycle"
import { type FeedFilters, getFeed, getMyJobs } from "@/features/jobs/queries"
import { requireViewer } from "@/features/profiles/queries"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search")
  return { title: t("title") }
}

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const viewer = await requireViewer()
  const t = await getTranslations("search")
  const sp = await searchParams
  const state: SearchState = {
    q: typeof sp.q === "string" ? sp.q.slice(0, 80) : "",
    cat: isCategory(sp.cat) ? sp.cat : "all",
    dist: pick(sp.dist, ["0", "1000", "2000", "5000"], "0"),
    minPay: pick(sp.minPay, ["0", "20", "30", "50"], "0"),
    when: pick(sp.when, ["any", "today", "tomorrow", "week", "weekend"], "any"),
    sort: pick(sp.sort, ["near", "pay", "soon"], SEARCH_DEFAULTS.sort as "near"),
  }
  const filters: FeedFilters = {
    q: state.q,
    category: isCategory(state.cat) ? state.cat : "all",
    maxDistM: Number(state.dist) || undefined,
    minPay: Number(state.minPay) || undefined,
    when: state.when as FeedFilters["when"],
    sort: state.sort as FeedFilters["sort"],
  }
  const [results, my] = await Promise.all([getFeed(viewer.id, filters), getMyJobs(viewer.id)])

  return (
    <Page wide>
      <h1 className="text-[1.875rem]">{t("title")}</h1>
      <SearchControls key={JSON.stringify(state)} state={state} />
      <p className="text-muted-foreground" aria-live="polite">
        {t("count", { count: results.length })}
      </p>
      {results.length ? (
        <JobGrid>
          {results.map((j) => (
            <JobCard key={j.id} job={j} status={statusLine(j, my.contextFor(j.id))} />
          ))}
        </JobGrid>
      ) : (
        <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
      )}
    </Page>
  )
}
