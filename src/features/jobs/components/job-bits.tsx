import { ArrowUpRight, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

import { ASSETS } from "@/config/pocket"
import { todayYmd, fmtTime } from "@/lib/dates"
import { dayLabel, fmtDist, fmtDur } from "@/lib/format"
import { TONE_CLASSES } from "@/lib/tones"
import { cn } from "@/lib/utils"

import { CATEGORIES, type CategoryKey } from "../categories"
import type { StatusLine } from "../lifecycle"
import type { JobCard as JobCardData } from "../queries"

export function CategoryTile({ category, size = "md" }: { category: CategoryKey; size?: "sm" | "md" }) {
  const { tone, icon: Icon } = CATEGORIES[category]
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center",
        TONE_CLASSES[tone],
        size === "md" ? "size-11 rounded-xl" : "size-9 rounded-[0.625rem]",
      )}
    >
      <Icon className={size === "md" ? "size-[1.375rem]" : "size-[1.125rem]"} strokeWidth={1.7} />
    </span>
  )
}

/** "Tomorrow, 17:00 · 30 min" in the reader's language. */
export function useWhen() {
  const t = useTranslations("time")
  const locale = useLocale()
  const today = todayYmd()
  return (job: { starts_on: string | null; start_min: number | null; dur_min: number | null }) =>
    `${dayLabel(job.starts_on ?? today, today, locale, { today: t("today"), tomorrow: t("tomorrow"), yesterday: t("yesterday") })}, ${fmtTime(job.start_min ?? 0)} · ${fmtDur(job.dur_min ?? 0)}`
}

export function categoryName(t: (key: string) => string, job: { category: string | null; category_label: string | null }) {
  return job.category === "other" && job.category_label ? job.category_label : t(job.category ?? "other")
}

/** The 16:9 picture: the team's drawing for the category, or the line icon; price and distance on top. */
export function JobThumb({ job, mine, big }: { job: JobCardData; mine?: boolean; big?: boolean }) {
  const t = useTranslations()
  const locale = useLocale()
  const category = (job.category ?? "other") as CategoryKey
  const { tone, icon: Icon } = CATEGORIES[category]
  const img = ASSETS.categories[category]
  return (
    <div className={cn("relative grid aspect-video place-items-center overflow-hidden", TONE_CLASSES[tone], big && "max-h-64 w-full")}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- team-provided drawing
        <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
      ) : category === "other" && job.category_label ? (
        <span className="px-5 text-center text-[1.625rem] font-extrabold text-muted-foreground">{job.category_label}</span>
      ) : (
        <Icon className="size-16 opacity-90" strokeWidth={1.4} aria-hidden />
      )}
      <span className="absolute right-2.5 bottom-2.5 bg-[rgb(15_20_17/0.82)] px-3 py-1 text-[1.0625rem] font-extrabold text-white tabular-nums">
        {t("common.lei", { amount: job.pay_lei ?? 0 })}
      </span>
      <span className="absolute bottom-2.5 left-2.5 bg-white/90 px-3 py-1 text-[0.90625rem] font-bold text-[#1a201c]">
        {mine ? t("jobs.yourJob") : job.dist_m != null ? fmtDist(job.dist_m, locale) : job.area_label}
      </span>
    </div>
  )
}

export function StatusText({ status }: { status: StatusLine }) {
  const t = useTranslations("jobStatus")
  if (!status) return null
  return (
    <span className={cn(status.highlight ? "font-bold text-coral-text" : "text-muted-foreground")}>
      {t(status.key, { count: status.count ?? 0 })}
    </span>
  )
}

/** Blog-1 card (sharp corners, inset bevel): picture, when, title, status, poster and area, arrow. */
export function JobCard({ job, status, mine }: { job: JobCardData; status?: StatusLine; mine?: boolean }) {
  const t = useTranslations()
  const locale = useLocale()
  const when = useWhen()
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col bg-[color-mix(in_srgb,var(--wm-tile)_55%,var(--card))] text-foreground no-underline shadow-[inset_0_0_2px_2px_rgb(255_255_255/0.9),inset_0_0_0_1px_rgb(40_25_15/0.18),0_0_0_1px_rgb(40_25_15/0.07),0_2px_4px_rgb(40_25_15/0.06)] transition-transform hover:-translate-y-0.5 dark:shadow-[inset_0_0_2px_2px_rgb(255_255_255/0.04),inset_0_0_0_1px_rgb(255_255_255/0.08),0_0_0_1px_rgb(255_255_255/0.06),0_2px_4px_rgb(0_0_0/0.4)]"
    >
      <div className="mx-1.5 mt-1.5">
        <JobThumb job={job} mine={mine} />
      </div>
      <div className="flex min-h-48 flex-1 flex-col px-5 py-4.5">
        <span className="text-[0.90625rem] font-semibold text-faint">{when(job)}</span>
        <span className="mt-3.5 text-[1.1875rem] leading-snug font-semibold tracking-[-0.015em]">{job.title}</span>
        {status ? (
          <span className="mt-1.5 text-[0.90625rem]">
            <StatusText status={status} />
          </span>
        ) : null}
        <span className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-semibold text-brand-text">
              {job.poster_name}
              {job.is_example ? <span className="ml-1.5 bg-secondary px-1.5 text-xs font-bold text-muted-foreground">{t("common.example")}</span> : null}
            </span>
            <span className="text-[0.90625rem] text-faint">
              {job.area_label}
              {!mine && job.dist_m != null ? ` · ${fmtDist(job.dist_m, locale)}` : ""}
            </span>
          </span>
          <span className="grid size-[2.125rem] shrink-0 place-items-center border border-input bg-card text-faint transition-colors group-hover:border-faint group-hover:text-foreground">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </span>
      </div>
    </Link>
  )
}

/** Career-1 style list row (sharp corners): tile, title, when and pay, status, "needs you" dot or arrow. */
export function JobRow({ job, status, needsYou }: { job: JobCardData; status?: StatusLine; needsYou?: boolean }) {
  const t = useTranslations()
  const when = useWhen()
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex items-start gap-3.5 border-[1.6px] border-border bg-card px-4 py-3.5 text-foreground no-underline hover:bg-wm-tile"
    >
      <CategoryTile category={(job.category ?? "other") as CategoryKey} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[1.15625rem] leading-snug font-bold">{job.title}</span>
        <span className="text-[0.96875rem] text-muted-foreground">
          {when(job)} · {t("common.lei", { amount: job.pay_lei ?? 0 })}
        </span>
        {status ? (
          <span className="text-[0.96875rem]">
            <StatusText status={status} />
          </span>
        ) : null}
      </span>
      {needsYou ? (
        <span className="mt-1.5 flex shrink-0 items-center gap-1.5 text-sm font-bold text-coral-text">
          <span className="size-3.5 rounded-full bg-coral" aria-hidden />
          {t("jobs.needsYou")}
        </span>
      ) : (
        <ChevronRight className="mt-1 size-5 shrink-0 text-faint" aria-hidden />
      )}
    </Link>
  )
}

/** Section heading with a short line and an optional link (the prototype's blog head). */
export function SectionHead({
  title,
  description,
  cta,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  cta?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col gap-2 desk:flex-row desk:items-end desk:justify-between">
      <h2 className="text-[1.75rem] tracking-tight">{title}</h2>
      <div className="flex flex-col gap-1.5 desk:items-end desk:text-right">
        {description ? <p className="max-w-md text-muted-foreground">{description}</p> : null}
        {cta ? (
          <Link href={cta.href} className="flex items-center gap-1.5 font-bold text-foreground no-underline hover:underline">
            {cta.label}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-input px-5 py-7 text-center text-muted-foreground">
      <b className="text-foreground">{title}</b>
      {body ? <span>{body}</span> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  )
}

export function JobGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">{children}</div>
}
