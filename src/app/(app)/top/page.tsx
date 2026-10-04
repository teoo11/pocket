import { Trophy } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Banner } from "@/components/banner"
import { Page } from "@/components/shell/app-shell"
import { Card } from "@/components/ui/card"
import { UserAvatar } from "@/components/user-avatar"
import { FluidTabs } from "@/components/watermelon/fluid-tabs"
import { LevelsTable } from "@/features/gamification/components/levels-table"
import { levelOf } from "@/features/gamification/levels"
import { Medal } from "@/features/leaderboard/components/medal"
import { currentMonth, getLeaderboard, type RankBy } from "@/features/leaderboard/queries"
import { requireViewer } from "@/features/profiles/queries"
import { fmtDur } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("top")
  return { title: t("title") }
}

export default async function TopPage({ searchParams }: PageProps<"/top">) {
  const viewer = await requireViewer()
  const t = await getTranslations()
  const locale = await getLocale()
  const sp = await searchParams
  const now = currentMonth()
  const period = sp.period === "all" || (typeof sp.period === "string" && /^\d{4}-\d{2}$/.test(sp.period) && sp.period <= now) ? sp.period : now
  const by: RankBy = sp.by === "jobs" || sp.by === "time" ? sp.by : "points"

  const supabase = await createClient()
  const [rows, myStats] = await Promise.all([
    getLeaderboard(period, by),
    supabase.from("profile_stats").select("points").eq("user_id", viewer.id).maybeSingle(),
  ])
  const mine = rows.findIndex((r) => r.user_id === viewer.id)
  const year = now.slice(0, 4)
  const monthName = (ym: string, style: "short" | "long") =>
    new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(
      new Date(`${ym}-01T00:00:00Z`),
    )
  const href = (p: string, b: RankBy) => `/top?period=${p}&by=${b}`
  const value = (r: (typeof rows)[number]) =>
    by === "jobs" ? t("top.jobsN", { count: r.jobs_done }) : by === "time" ? fmtDur(r.minutes) : t("top.pts", { count: r.points })

  return (
    <Page>
      <div>
        <h1 className="text-[2rem]">{t("top.title")}</h1>
        <p className="text-muted-foreground">
          {period === "all" ? t("top.allTime") : monthName(period, "long")}
          {period === now ? ` · ${t("top.thisMonth")}` : ""}
        </p>
      </div>

      <FluidTabs
        layoutId="top-months"
        label={t("top.month")}
        active={period}
        items={[{ id: "all", label: t("top.allTime"), href: href("all", by) }].concat(
          Array.from({ length: 12 }, (_, i) => {
            const ym = `${year}-${String(i + 1).padStart(2, "0")}`
            return { id: ym, label: monthName(ym, "short"), href: href(ym, by), disabled: ym > now, tag: ym === now ? t("top.now") : undefined }
          }),
        )}
      />
      <FluidTabs
        variant="segment"
        layoutId="top-rank"
        label={t("top.rankBy")}
        active={by}
        items={(["points", "jobs", "time"] as const).map((b) => ({ id: b, label: t(`top.by.${b}`), href: href(period, b) }))}
      />

      {mine >= 0 ? (
        <Banner tone="brand" icon={Trophy} title={t("top.youAre", { n: mine + 1, of: rows.length })}>
          {t("top.youSummary", { jobs: rows[mine].jobs_done, time: fmtDur(rows[mine].minutes), points: rows[mine].points })}
        </Banner>
      ) : (
        <Banner tone="grey" icon={Trophy} title={t("top.notYet")}>
          {t("top.notYetBody")}
        </Banner>
      )}

      {rows.length ? (
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={r.user_id}>
              <Link
                href={`/profile/${r.user_id}`}
                className={cn(
                  "flex items-center gap-3 rounded-[1.25rem] border-[1.6px] border-border bg-card px-3 py-2.5 text-foreground no-underline hover:bg-wm-tile",
                  r.user_id === viewer.id && "border-primary bg-brand-soft",
                )}
              >
                <Medal rank={i + 1} />
                <UserAvatar name={r.display_name} path={r.avatar_path} tone={r.user_id === viewer.id ? "brand" : "sun"} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex flex-wrap items-center gap-1.5 font-bold">
                    {r.display_name}
                    {r.user_id === viewer.id ? ` (${t("top.you")})` : ""}
                    <span className="rounded-md bg-brand-soft px-1.5 text-xs font-bold text-brand-text">{t("levels.chip", { n: levelOf(r.points).n })}</span>
                    {r.is_example ? <span className="rounded-md bg-secondary px-1.5 text-xs font-bold text-muted-foreground">{t("common.example")}</span> : null}
                  </span>
                  <span className="text-[0.90625rem] text-muted-foreground">
                    {t("top.jobsN", { count: r.jobs_done })} · {fmtDur(r.minutes)} · {r.avg_rating ? `${Number(r.avg_rating).toFixed(1)} ★` : t("job.new")}
                  </span>
                </span>
                <span className="font-extrabold whitespace-nowrap tabular-nums">{value(r)}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground">{period === "all" ? t("top.emptyAll") : t("top.emptyMonth", { month: monthName(period, "long") })}</p>
      )}

      <Card className="px-5">
        <h2 className="text-xl">{t("top.howPoints")}</h2>
        <p>{t.rich("top.howPointsBody", { b: (c) => <b>{c}</b> })}</p>
        <p>{t.rich("top.example", { b: (c) => <b>{c}</b> })}</p>
        <p className="text-muted-foreground">{t("top.howPointsNote")}</p>
      </Card>
      <Card id="levels" className="scroll-mt-20 px-5">
        <h2 className="text-xl">{t("top.levels")}</h2>
        <p>{t("top.levelsBody")}</p>
        <LevelsTable current={levelOf(myStats.data?.points ?? 0).n} />
      </Card>
    </Page>
  )
}
