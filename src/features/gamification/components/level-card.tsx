import Link from "next/link"
import { useTranslations } from "next-intl"

import { levelOf } from "../levels"
import { useLevelName } from "./levels-table"

/** Level badge, name, progress bar and points to the next level (the prototype's level card). */
export function LevelCard({ points }: { points: number }) {
  const t = useTranslations("level")
  const name = useLevelName()
  const l = levelOf(points)
  return (
    <section className="flex items-center gap-4 rounded-[1.25rem] border-[1.6px] border-border bg-card p-4">
      <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-soft text-brand-text">
        <small className="text-[0.6875rem] font-bold tracking-wide uppercase">{t("level")}</small>
        <span className="text-2xl leading-none font-extrabold">{l.n}</span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <b className="text-lg">{name(l.n)}</b>
          <span className="text-muted-foreground tabular-nums">{t("points", { count: points })}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-wm-track" role="progressbar" aria-valuenow={l.pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("progress")}>
          <i className="block h-full rounded-full bg-primary" style={{ width: `${l.pct}%` }} />
        </div>
        <span className="text-[0.9375rem] text-muted-foreground">
          {t.rich("toNext", { count: l.toGo, n: l.n + 1, name: name(l.n + 1), b: (c) => <b>{c}</b> })}
        </span>
        <Link href="/top#levels" className="text-[0.9375rem] font-semibold text-brand-text">
          {t("seeAll")}
        </Link>
      </div>
    </section>
  )
}
