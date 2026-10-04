import { ArrowLeft, Banknote, CreditCard, Lock } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { EmptyState } from "@/features/jobs/components/job-bits"
import { getMyEarnings } from "@/features/payments/queries"
import { requireViewer } from "@/features/profiles/queries"
import { fmtLei } from "@/lib/format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("me")
  return { title: t("earnings") }
}

/** Every payment I received, newest first. Private to me. */
export default async function EarningsPage() {
  const viewer = await requireViewer()
  const t = await getTranslations()
  const locale = await getLocale()
  const { rows, total } = await getMyEarnings(viewer.id)
  const date = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(iso)) : ""

  return (
    <Page>
      <Link href="/me" className="flex min-h-12 items-center gap-1.5 self-start font-semibold text-muted-foreground no-underline">
        <ArrowLeft className="size-5" aria-hidden />
        {t("nav.me")}
      </Link>
      <div>
        <h1 className="text-[1.875rem]">{t("me.earnings")}</h1>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <Lock className="size-4" aria-hidden />
          {t("me.onlyYou")} · {t("me.total", { amount: fmtLei(total, locale) })}
        </p>
      </div>
      {rows.length ? (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/jobs/${r.jobId}`} className="flex items-center gap-3 border-[1.6px] border-border bg-card px-4 py-3 text-foreground no-underline hover:bg-wm-tile">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-soft text-sage-text">
                  {r.method === "card" ? <CreditCard className="size-5" aria-hidden /> : <Banknote className="size-5" aria-hidden />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className="truncate">{r.title}</b>
                  <span className="text-[0.9375rem] text-muted-foreground">
                    {r.part === 1 ? t("me.part1") : t("me.part2")} · {t(`me.method.${r.method}`)} · {date(r.at)}
                  </span>
                </span>
                <span className="font-extrabold whitespace-nowrap tabular-nums">+{fmtLei(r.lei, locale)} lei</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("me.noEarnings")} body={t("me.noEarningsBody")} />
      )}
    </Page>
  )
}
