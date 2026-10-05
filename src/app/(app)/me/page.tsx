import { ChevronRight, CircleHelp, Flag, Globe, Lock, Mail, Shield, Trophy } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { Button } from "@/components/ui/button"
import { LevelCard } from "@/features/gamification/components/level-card"
import type { CategoryKey } from "@/features/jobs/categories"
import { currentMonth, getLeaderboard } from "@/features/leaderboard/queries"
import { ReportButton } from "@/features/moderation/components/report-button"
import { PayoutsCard } from "@/features/payments/components/payouts-card"
import { getMyEarnings, getPayoutState } from "@/features/payments/queries"
import { YourData } from "@/features/profiles/components/delete-account"
import { PublicProfileActivity, PublicProfileSummary } from "@/features/profiles/components/public-profile"
import { AvatarUpload, SavingsGoalButton, type SettingsData, SettingsRows } from "@/features/profiles/components/settings"
import { getHistory, getPublicProfile, getReviewsAbout, requireViewer } from "@/features/profiles/queries"
import { fmtDur, fmtLei } from "@/lib/format"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav")
  return { title: t("me") }
}

/** A labelled part of the profile: what neighbours see, or what only you see. */
function Visibility({ kind, title, hint, children }: { kind: "public" | "private"; title: string; hint: string; children: React.ReactNode }) {
  const Icon = kind === "public" ? Globe : Lock
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3", kind === "public" ? "bg-sky-soft text-sky-text" : "bg-wm-track")}>
        <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.7} aria-hidden />
        <span className="flex flex-col">
          <b>{title}</b>
          <span className={cn("text-[0.9375rem]", kind === "private" && "text-muted-foreground")}>{hint}</span>
        </span>
      </div>
      {children}
    </section>
  )
}

/**
 * Your profile in one place. Public: exactly what neighbours see (the same markup as /profile/[id]), with
 * the controls to change it. Private: earnings, card payouts, phone, home address, job suggestions, your data.
 */
export default async function MePage() {
  const viewer = await requireViewer()
  const [t, locale, pub, history, reviews, earnings, month, payout] = await Promise.all([
    getTranslations(),
    getLocale(),
    getPublicProfile(viewer.id),
    getHistory(viewer.id),
    getReviewsAbout(viewer.id),
    getMyEarnings(viewer.id),
    getLeaderboard(currentMonth(), "points", 200),
    getPayoutState(viewer.id, viewer.profile.accepts_card),
  ])
  const p = viewer.profile
  const stats = pub?.stats
  const rank = month.findIndex((r) => r.user_id === viewer.id)
  const goal = viewer.private.savings_goal_lei
  const pct = goal ? Math.min(100, Math.round((earnings.total / goal) * 100)) : 0
  const settings: SettingsData = {
    userId: viewer.id,
    name: p.display_name,
    phone: viewer.private.phone,
    homeLabel: viewer.private.home_label,
    homeLat: viewer.private.home_lat,
    homeLng: viewer.private.home_lng,
    schedule: p.schedule,
    skills: p.skills as CategoryKey[],
    maxDistM: p.max_dist_m,
    bio: p.bio,
    locale,
  }
  const profile = pub ?? { profile: p, stats: null }

  return (
    <Page>
      <Visibility kind="public" title={t("me.publicTitle")} hint={t("me.publicHint")}>
        <PublicProfileSummary
          data={profile}
          history={history}
          reviews={reviews}
          self
          editControls={<AvatarUpload userId={viewer.id} hasPhoto={!!p.avatar_path} />}
        />
        <SettingsRows data={settings} rows={["name", "bio"]} />
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
      </Visibility>

      <Visibility kind="private" title={t("me.privateTitle")} hint={t("me.privateHint")}>
        {/* There is no withdraw button (SPEC). */}
        <section className="flex flex-col gap-3 rounded-3xl bg-earnings p-5 text-earnings-foreground">
          <span className="font-extrabold">{t("me.earnings")}</span>
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
              <div
                className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("me.goalProgress")}
              >
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

        <div className="flex flex-col gap-2">
          <h2 className="text-xl">{t("me.contactTitle")}</h2>
          <p className="text-[0.9375rem] text-muted-foreground">{t("me.contactHint")}</p>
          <SettingsRows data={settings} rows={["phone", "home"]} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl">{t("me.suggestionsTitle")}</h2>
          <p className="text-[0.9375rem] text-muted-foreground">{t("me.suggestionsHint")}</p>
          <SettingsRows data={settings} rows={["schedule", "skills", "dist"]} />
        </div>

        <YourData />
      </Visibility>

      <Visibility kind="public" title={t("me.activityTitle")} hint={t("me.activityHint")}>
        <PublicProfileActivity data={profile} history={history} reviews={reviews} self />
      </Visibility>

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
