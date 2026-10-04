import { Bell, ChevronRight, Plus, Trophy } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { Button } from "@/components/ui/button"
import { FluidTabs } from "@/components/watermelon/fluid-tabs"
import { CATEGORY_KEYS, type CategoryKey, isCategory } from "@/features/jobs/categories"
import { CategoryTile, EmptyState, JobCard, JobGrid, SectionHead } from "@/features/jobs/components/job-bits"
import { statusLine } from "@/features/jobs/lifecycle"
import { getFeed, getMyJobs, getPopularCategories, needsYouCount } from "@/features/jobs/queries"
import { Medal } from "@/features/leaderboard/components/medal"
import { currentMonth, getLeaderboard } from "@/features/leaderboard/queries"
import { requireViewer } from "@/features/profiles/queries"

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const viewer = await requireViewer()
  const t = await getTranslations()
  const { cat } = await searchParams
  const category: CategoryKey | "all" = isCategory(cat) ? cat : "all"

  const [feed, near, popular, top, my] = await Promise.all([
    getFeed(viewer.id, { category, sort: "feed" }),
    category === "all" ? getFeed(viewer.id, { sort: "near", limit: 5 }) : Promise.resolve([]),
    category === "all" ? getPopularCategories() : Promise.resolve([]),
    getLeaderboard(currentMonth(), "points", 3),
    getMyJobs(viewer.id),
  ])
  const needsYou = needsYouCount(my)
  const nearIds = new Set(near.map((j) => j.id))
  const more = category === "all" ? feed.filter((j) => !nearIds.has(j.id)) : feed
  const status = (j: (typeof feed)[number]) => statusLine(j, my.contextFor(j.id))
  const catName = category === "all" ? "" : t(`categories.${category}`)

  return (
    <Page wide>
      <h1 className="sr-only">{t("home.title")}</h1>
      <FluidTabs
        layoutId="home-cats"
        label={t("home.kindOfJob")}
        active={category}
        items={[{ id: "all", label: t("categories.all"), href: "/" }].concat(
          CATEGORY_KEYS.map((k) => ({ id: k, label: t(`categories.${k}`), href: `/?cat=${k}` })),
        )}
      />

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

      {category === "all" ? (
        <>
          {popular.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-[1.75rem] tracking-tight">{t("home.popular")}</h2>
              <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1.5 [scrollbar-width:none] desk:mx-0 desk:grid desk:grid-cols-5 desk:overflow-visible desk:px-0">
                {popular.map((p, i) => (
                  <Link
                    key={p.category}
                    href={`/?cat=${p.category}`}
                    className="relative flex min-h-30 w-38 shrink-0 snap-start flex-col items-start gap-2.5 rounded-[1.25rem] border-[1.6px] border-border bg-card p-3.5 text-foreground no-underline hover:bg-wm-tile desk:w-auto"
                  >
                    <CategoryTile category={p.category} />
                    <span className="flex flex-col gap-0.5">
                      <b className="leading-tight">{t(`categories.${p.category}`)}</b>
                      <span className="text-[0.90625rem] text-faint">{t("home.openCount", { count: p.open_count })}</span>
                    </span>
                    {i === 0 ? (
                      <span className="absolute top-3 right-3 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-text">
                        {t("home.mostAsked")}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionHead
              title={t("home.nearTitle", { count: near.length })}
              description={t("home.nearDesc", { place: viewer.private.home_label ?? viewer.profile.area_label ?? "" })}
              cta={{ href: "/map", label: t("home.onMap") }}
            />
            {near.length ? (
              <JobGrid>
                {near.map((j) => (
                  <JobCard key={j.id} job={j} status={status(j)} />
                ))}
              </JobGrid>
            ) : (
              <p className="text-muted-foreground">{t("home.nearNone")}</p>
            )}
          </section>
        </>
      ) : null}

      <section className="flex flex-col gap-3">
        <SectionHead
          title={category === "all" ? t("home.moreTitle") : t("home.catTitle", { category: catName })}
          description={category === "all" ? t("home.moreDesc") : t("home.catDesc", { category: catName.toLocaleLowerCase() })}
          cta={{ href: category === "all" ? "/search" : `/search?cat=${category}`, label: t("home.searchFilters") }}
        />
        {more.length ? (
          <JobGrid>
            {more.map((j) => (
              <JobCard key={j.id} job={j} status={status(j)} />
            ))}
          </JobGrid>
        ) : (
          <EmptyState title={t("home.emptyTitle")} body={t("home.emptyBody")}>
            <Button asChild>
              <Link href="/post">
                <Plus aria-hidden />
                {t("nav.postJob")}
              </Link>
            </Button>
          </EmptyState>
        )}
      </section>
    </Page>
  )
}
