import { ArrowRight, Bell, Briefcase, Clock, Coins, MapPin, Sparkles } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { FluidTabs } from "@/components/watermelon/fluid-tabs"
import { CATEGORIES, type CategoryKey } from "@/features/jobs/categories"
import { categoryName, StatusText } from "@/features/jobs/components/job-bits"
import { needsAction, statusLine } from "@/features/jobs/lifecycle"
import { getMyJobs, type JobCard } from "@/features/jobs/queries"
import { requireViewer } from "@/features/profiles/queries"
import { fmtTime, todayYmd } from "@/lib/dates"
import { dayLabel } from "@/lib/format"
import { TONE_CLASSES } from "@/lib/tones"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav")
  return { title: t("myJobs") }
}

type Tab = "helping" | "asked" | "done"

/** Finished for me: paid and reviewed by me, or cancelled. */
function isPast(j: JobCard, reviewed: boolean) {
  return j.status === "cancelled" || (j.status === "paid" && reviewed)
}

export default async function MyJobsPage({ searchParams }: PageProps<"/my-jobs">) {
  const viewer = await requireViewer()
  const t = await getTranslations()
  const locale = await getLocale()
  const { tab: tabParam } = await searchParams
  const tab: Tab = tabParam === "asked" || tabParam === "done" ? tabParam : "helping"
  const my = await getMyJobs(viewer.id)
  const past = (j: JobCard) => isPast(j, my.reviewed.has(j.id))

  const helping = [...my.helping, ...my.offered].filter((j) => !past(j))
  const lists: Record<Tab, JobCard[]> = {
    helping,
    asked: my.posted.filter((j) => !past(j)),
    done: [...my.helping, ...my.posted]
      .filter(past)
      .sort((a, b) => (b.confirmed_at ?? b.starts_on ?? "").localeCompare(a.confirmed_at ?? a.starts_on ?? "")),
  }
  const needs = (j: JobCard) => needsAction(j, my.contextFor(j.id))
  const list = tab === "done" ? lists.done : [...lists[tab]].sort((a, b) => Number(needs(b)) - Number(needs(a)))
  const today = todayYmd()
  const words = { today: t("time.today"), tomorrow: t("time.tomorrow"), yesterday: t("time.yesterday") }

  return (
    <Page>
      <section className="flex flex-col gap-4">
        <span className="flex w-fit items-center gap-1.5 rounded-full border-[1.6px] border-border bg-card px-3 py-1 text-sm font-bold text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden />
          {t("nav.myJobs")}
        </span>
        <h1 className="text-[2rem] leading-tight">
          {t.rich("myJobs.title", { hl: (c) => <span className="rounded-md bg-brand-soft px-1.5 text-brand-text">{c}</span> })}
        </h1>
        <p className="text-muted-foreground">{t("myJobs.lede")}</p>
        <FluidTabs
          layoutId="my-jobs-tabs"
          label={t("nav.myJobs")}
          active={tab}
          items={(["helping", "asked", "done"] as const).map((k) => ({
            id: k,
            label: t(`myJobs.tabs.${k}`),
            href: k === "helping" ? "/my-jobs" : `/my-jobs?tab=${k}`,
            count: lists[k].length,
          }))}
        />

        {list.length ? (
          <ul className="flex flex-col gap-2.5">
            {list.slice(0, 60).map((j) => {
              const cat = (j.category ?? "other") as CategoryKey
              const st = statusLine(j, my.contextFor(j.id))
              return (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="flex flex-col gap-2.5 border-[1.6px] border-border bg-card px-4 py-3.5 text-foreground no-underline hover:bg-wm-tile"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <b className="text-[1.125rem]">{j.title}</b>
                      {needs(j) ? (
                        <span className="flex items-center gap-1 rounded-full bg-coral-soft px-2 py-0.5 text-sm font-bold text-coral-text">
                          <Bell className="size-3.5" aria-hidden />
                          {t("jobs.needsYou")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[0.96875rem]">{st ? <StatusText status={st} /> : <span className="text-muted-foreground">{categoryName((k) => t(`categories.${k}`), j)}</span>}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[0.90625rem]">
                      <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold", TONE_CLASSES[CATEGORIES[cat].tone])}>
                        <MapPin className="size-3.5" aria-hidden />
                        {j.area_label}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold">
                        <Clock className="size-3.5" aria-hidden />
                        {dayLabel(j.starts_on ?? today, today, locale, words)}, {fmtTime(j.start_min ?? 0)}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold">
                        <Coins className="size-3.5" aria-hidden />
                        {t("common.lei", { amount: j.pay_lei ?? 0 })}
                      </span>
                      <ArrowRight className="ml-auto size-4 text-faint" aria-hidden />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-1.5 border-[1.6px] border-dashed border-input px-5 py-8 text-center">
            <Briefcase className="size-6 text-faint" aria-hidden />
            <b>{t("myJobs.emptyTitle")}</b>
            <p className="text-muted-foreground">{t(`myJobs.empty.${tab}`)}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-wm-tile px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <Briefcase className="size-4" aria-hidden />
            {tab === "asked" ? t("myJobs.ctaAsked") : t("myJobs.ctaHelping")}
          </span>
          <Link href={tab === "asked" ? "/post" : "/"} className="flex min-h-11 items-center gap-1.5 font-bold text-brand-text">
            {tab === "asked" ? t("nav.postJob") : t("myJobs.seeNear")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </Page>
  )
}
