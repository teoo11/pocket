import { Check, ChevronRight, History, Lock, MapPin, Navigation, Phone, Shield } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Banner } from "@/components/banner"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { jobPoints } from "@/features/gamification/levels"
import { fmtDist, fmtDur } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { CategoryKey } from "../categories"
import { minorsWarning } from "../safety"
import { CopyButton } from "./copy-button"

export function Facts({ items }: { items: { label: string; value: React.ReactNode; note?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2.5 desk:grid-cols-4">
      {items.map((f) => (
        <div key={f.label} className="rounded-2xl border-[1.6px] border-border bg-card px-4 py-3">
          <dt className="text-[0.90625rem] text-faint">{f.label}</dt>
          <dd className="text-lg leading-snug font-bold">{f.value}</dd>
          {f.note ? <dd className="text-sm text-muted-foreground">{f.note}</dd> : null}
        </div>
      ))}
    </dl>
  )
}

/** "This job is worth 3 points: 2 for 30 min of work + 1 for completing the job." */
export function PointsBox({ minutes, earned, who }: { minutes: number; earned: boolean; who: "you" | "yourHelper" | "theHelper" }) {
  const t = useTranslations("job")
  const total = jobPoints(minutes)
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-sun-soft px-4 py-3.5 text-sun-text">
      <span className="flex items-baseline gap-0.5 text-[2rem] leading-none font-extrabold tabular-nums">
        {total}
        <small className="text-sm font-bold">{t("pts")}</small>
      </span>
      <span className="flex flex-col">
        <b>{earned ? t(`earned.${who}`, { count: total }) : t("worth", { count: total })}</b>
        <span className="text-[0.9375rem]">{t("pointsWhy", { count: total - 1, dur: fmtDur(minutes) })}</span>
      </span>
    </div>
  )
}

export function MinorsNote({ job }: { job: { category: CategoryKey; start_min: number; dur_min: number } }) {
  const t = useTranslations("minorsNote")
  const level = minorsWarning(job)
  return (
    <Banner tone={level === "default" ? "grey" : "coral"} icon={Shield} title={t(`${level === "default" ? "default" : level}Title`)}>
      {t(`${level === "default" ? "default" : level}Body`)}{" "}
      <Link href="/minors" className="font-bold text-current underline">
        {t("link")}
      </Link>
    </Banner>
  )
}

/** After the pick: the other person, their number (if they added one), Call, Directions, the address. */
export function ContactBox({
  name,
  avatarPath,
  phone,
  address,
  lat,
  lng,
}: {
  name: string
  avatarPath?: string | null
  phone: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
}) {
  const t = useTranslations("job")
  return (
    <div className="flex flex-col gap-3 rounded-3xl border-[1.6px] border-border bg-card p-4 shadow-wm-xs">
      <div className="flex items-center gap-3">
        <UserAvatar name={name} path={avatarPath} />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{name}</div>
          <div className="text-lg tabular-nums">{phone ?? t("noPhone")}</div>
        </div>
        {phone ? <CopyButton text={phone} /> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {phone ? (
          <Button asChild size="lg" className="flex-1">
            <a href={`tel:${phone.replace(/\s/g, "")}`}>
              <Phone aria-hidden />
              {t("call")}
            </a>
          </Button>
        ) : null}
        {lat != null && lng != null ? (
          <Button asChild size="lg" variant="outline" className="flex-1">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer">
              <Navigation aria-hidden />
              {t("directions")}
            </a>
          </Button>
        ) : null}
      </div>
      {address ? (
        <p className="flex items-start gap-2">
          <MapPin className="mt-1 size-4 shrink-0" aria-hidden />
          <span>
            <b>{t("address")}</b> {address}
          </span>
        </p>
      ) : null}
    </div>
  )
}

/** The two halves and whether each has been paid. */
export function PayProgress({
  halves,
  firstPaid,
  allPaid,
  view,
}: {
  halves: [number, number]
  firstPaid: boolean
  allPaid: boolean
  view: "poster" | "helper"
}) {
  const t = useTranslations("job")
  const row = (ok: boolean, label: string, amount: number, wait: string) => (
    <div className="flex items-center gap-3 py-2">
      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 border-input", ok && "border-0 bg-sage text-white")}>
        {ok ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
      </span>
      <span className="flex flex-1 flex-col">
        <b>{label}</b>
        <span className="text-[0.9375rem] text-muted-foreground">{ok ? (view === "poster" ? t("paid") : t("received")) : wait}</span>
      </span>
      <span className="font-bold tabular-nums">{t("lei", { amount })}</span>
    </div>
  )
  return (
    <div className="rounded-3xl border-[1.6px] border-border bg-card px-4 py-3 shadow-wm-xs">
      <span className="text-sm font-bold tracking-wide text-faint uppercase">{view === "poster" ? t("yourPayments") : t("yourEarnings")}</span>
      {row(firstPaid || allPaid, t("firstHalf"), halves[0], t("whenStarts"))}
      {row(allPaid, t("secondHalf"), halves[1], t("whenDone"))}
      {view === "helper" ? (
        <p className="flex items-center gap-1.5 pt-1 text-[0.9375rem] text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          {t("earningsPrivate")}
        </p>
      ) : null}
    </div>
  )
}

/** A person who offered to help, with their record and a Pick button (the prototype's helperRow). */
export function HelperRow({
  helperId,
  name,
  avatarPath,
  isExample,
  rating,
  jobsDone,
  distM,
  level,
  locale,
  children,
}: {
  helperId: string
  name: string
  avatarPath: string | null
  isExample: boolean
  rating: number | null
  jobsDone: number
  distM: number | null
  level: number
  locale: string
  children?: React.ReactNode
}) {
  const t = useTranslations()
  return (
    <div className="flex items-start gap-3 border-[1.6px] border-border bg-card px-4 py-3.5">
      <UserAvatar name={name} path={avatarPath} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-1.5 text-[1.0625rem] font-bold">
          {name}
          <span className="rounded-md bg-brand-soft px-1.5 text-xs font-bold text-brand-text">{t("levels.chip", { n: level })}</span>
          {isExample ? <span className="rounded-md bg-secondary px-1.5 text-xs font-bold text-muted-foreground">{t("common.example")}</span> : null}
        </span>
        <span className="text-[0.96875rem] text-muted-foreground">
          {rating ? `${rating.toFixed(1)} ★` : t("job.new")} · {t("job.jobsDone", { count: jobsDone })}
          {distM != null ? ` · ${t("job.livesAway", { dist: fmtDist(distM, locale) })}` : ""}
        </span>
        <Link href={`/profile/${helperId}`} className="flex items-center gap-1 text-[0.9375rem] font-semibold text-brand-text">
          <History className="size-3.5" aria-hidden />
          {t("job.seeTheirJobs", { name: name.split(" ")[0] })}
        </Link>
      </div>
      {children}
    </div>
  )
}

export function PersonRow({ href, name, avatarPath, level, isExample, subtitle }: { href: string; name: string; avatarPath: string | null; level: number; isExample: boolean; subtitle: string }) {
  const t = useTranslations()
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[1.25rem] border-[1.6px] border-border bg-card p-3 text-foreground no-underline hover:bg-wm-tile">
      <UserAvatar name={name} path={avatarPath} tone="sun" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-1.5 font-bold">
          {name}
          <span className="rounded-md bg-brand-soft px-1.5 text-xs font-bold text-brand-text">{t("levels.chip", { n: level })}</span>
          {isExample ? <span className="rounded-md bg-secondary px-1.5 text-xs font-bold text-muted-foreground">{t("common.example")}</span> : null}
        </span>
        <span className="text-[0.9375rem] text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-5 text-faint" aria-hidden />
    </Link>
  )
}

