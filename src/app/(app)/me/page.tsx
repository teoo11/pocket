import { ChevronRight, CircleHelp, Flag, Lock, Mail, Shield, Trophy } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { LevelCard } from "@/features/gamification/components/level-card"
import type { CategoryKey } from "@/features/jobs/categories"
import { currentMonth, getLeaderboard } from "@/features/leaderboard/queries"
import { ReportButton } from "@/features/moderation/components/report-button"
import { PayoutsCard } from "@/features/payments/components/payouts-card"
import { getMyEarnings, getPayoutState } from "@/features/payments/queries"
import { YourData } from "@/features/profiles/components/delete-account"
import { AvatarUpload, SavingsGoalButton, SettingsList } from "@/features/profiles/components/settings"
import { getPublicProfile, requireViewer } from "@/features/profiles/queries"
import { fmtDur, fmtLei } from "@/lib/format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav")
  return { title: t("me") }
}

export default async function MePage() {
  const viewer = await requireViewer()
  const t = await getTranslations()
  const locale = await getLocale()
  const [pub, earnings, month, payout] = await Promise.all([
    getPublicProfile(viewer.id),
    getMyEarnings(viewer.id),
    getLeaderboard(currentMonth(), "points", 200),
    getPayoutState(viewer.id, viewer.profile.accepts_card),
  ])
  const stats = pub?.stats
  const p = viewer.profile
  const rank = month.findIndex((r) => r.user_id === viewer.id)
  const goal = viewer.private.savings_goal_lei
  const pct = goal ? Math.min(100, Math.round((earnings.total / goal) * 100)) : 0

  return (
    <Page>
      <section className="flex items-center gap-4">
        <UserAvatar name={p.display_name} path={p.avatar_path} size="lg" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-[1.875rem]">{p.display_name}</h1>
          <p className="text-muted-foreground">
            {stats?.helper_rating ? `${Number(stats.helper_rating).toFixed(1)} ★` : t("job.new")} · {t("job.jobsDone", { count: stats?.jobs_done ?? 0 })} · {viewer.private.home_label}
          </p>
          <AvatarUpload userId={viewer.id} hasPhoto={!!p.avatar_path} />
        </div>
      </section>

      <Link
        href="/top"
        className="relative flex flex-col gap-1 rounded-[1.25rem] border-[1.6px] border-border bg-card py-3.5 pr-12 pl-4 text-foreground no-underline"
      >
        <span className="flex items-center gap-2 font-extrabold text-brand-text">
          <Trophy className="size-[1.125rem]" strokeWidth={1.7} aria-hidden />
          {rank >= 0 ? t("me.rank", { n: rank + 1 }) : t("top.title")}
        </span>
        <span className="text-muted-foreground">
          {rank >= 0 ? t("me.rankLine", { points: month[rank].points, time: fmtDur(month[rank].minutes) }) : t("me.rankNone")}
        </span>
        <ChevronRight className="absolute top-1/2 right-4 size-5 -translate-y-1/2" aria-hidden />
      </Link>

      <LevelCard points={stats?.points ?? 0} />

      {/* Private: only the owner ever sees this. There is no withdraw button (SPEC). */}
      <section className="flex flex-col gap-3 rounded-3xl bg-earnings p-5 text-earnings-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold">{t("me.earnings")}</span>
          <span className="flex items-center gap-1 rounded-full bg-white/40 px-2 py-0.5 text-sm font-semibold dark:bg-white/10">
            <Lock className="size-3.5" aria-hidden />
            {t("me.onlyYou")}
          </span>
        </div>
        <div className="text-[2.75rem] leading-none font-extrabold tabular-nums">
          {fmtLei(earnings.total, locale)} <small className="text-xl">lei</small>
        </div>
        {goal && viewer.private.savings_goal_name ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-2">
              <span>{t.rich("me.savingFor", { name: viewer.private.savings_goal_name, b: (c) => <b>{c}</b> })}</span>
              <span className="tabular-nums">
                {fmtLei(earnings.total, locale)} / {goal}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("me.goalProgress")}>
              <i className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <SavingsGoalButton goalName={viewer.private.savings_goal_name} goalLei={goal} />
          <Button asChild variant="outline">
            <Link href="/me/earnings">{t("me.seeEarnings")}</Link>
          </Button>
        </div>
      </section>

      <PayoutsCard state={payout} />

      <SettingsList
        data={{
          userId: viewer.id,
          name: p.display_name,
          phone: viewer.private.phone,
          homeLabel: viewer.private.home_label,
          schedule: p.schedule,
          skills: p.skills as CategoryKey[],
          maxDistM: p.max_dist_m,
          bio: p.bio,
          locale,
        }}
      />

      <section className="rounded-3xl border-[1.6px] border-border bg-card px-4 py-1 shadow-wm-xs">
        {[
          { href: "/help", icon: CircleHelp, label: t("help.title") },
          { href: "/minors", icon: Shield, label: t("minors.title"), sub: t("me.minorsSub") },
          { href: "/contact", icon: Mail, label: t("contact.title"), sub: t("me.contactSub") },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="flex min-h-16 items-center gap-3 border-b border-border px-1 py-2.5 text-foreground no-underline hover:bg-wm-tile">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-wm-tile">
              <l.icon className="size-[1.125rem]" strokeWidth={1.7} aria-hidden />
            </span>
            <span className="flex flex-1 flex-col">
              <b>{l.label}</b>
              {l.sub ? <span className="text-[0.9375rem] text-muted-foreground">{l.sub}</span> : null}
            </span>
            <ChevronRight className="size-5 text-faint" aria-hidden />
          </Link>
        ))}
        <div className="flex min-h-16 items-center gap-3 px-1 py-1">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-wm-tile">
            <Flag className="size-[1.125rem]" strokeWidth={1.7} aria-hidden />
          </span>
          <ReportButton kind="app" label={t("report.problem")} className="no-underline" />
        </div>
      </section>

      <YourData />

      <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-center text-sm text-muted-foreground">
        <Link href="/privacy" className="font-semibold text-muted-foreground">
          {t("legal.privacyTitle")}
        </Link>
        <Link href="/terms" className="font-semibold text-muted-foreground">
          {t("legal.termsTitle")}
        </Link>
        <Link href="/legal/notices" className="font-semibold text-muted-foreground">
          {t("credit")}
        </Link>
      </p>
    </Page>
  )
}
