import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { getInbox } from "@/features/chat/queries"
import { EmptyState } from "@/features/jobs/components/job-bits"
import { requireViewer } from "@/features/profiles/queries"
import { todayYmd } from "@/lib/dates"
import { dayLabel, intlLocale } from "@/lib/format"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("chat"))("title") }
}

export default async function MessagesPage() {
  const viewer = await requireViewer()
  const [inbox, t, tTime, locale] = await Promise.all([getInbox(), getTranslations("chat"), getTranslations("time"), getLocale()])
  const today = todayYmd()
  const words = { today: tTime("today"), tomorrow: tTime("tomorrow"), yesterday: tTime("yesterday") }
  const time = new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" })

  return (
    <Page>
      <h1 className="text-[1.875rem]">{t("title")}</h1>
      <p className="-mt-3 text-muted-foreground">{t("lede")}</p>
      {inbox.length === 0 ? (
        <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {inbox.map((c) => {
            const at = new Date(c.last_message_at)
            const day = at.toLocaleDateString("en-CA", { timeZone: "Europe/Bucharest" })
            const preview = c.last_body ? `${c.last_sender_id === viewer.id ? `${t("you")}: ` : ""}${c.last_body}` : t("noMessages")
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={cn(
                    "flex items-center gap-3 border-[1.6px] border-border bg-card px-4 py-3.5 text-foreground no-underline hover:border-primary",
                    c.closed_at && "opacity-75",
                  )}
                >
                  <UserAvatar name={c.other_name} path={c.other_avatar} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <b className="truncate text-[1.0625rem]">{c.other_name ?? t("someone")}</b>
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                        {day === today ? time.format(at) : dayLabel(day, today, locale, words)}
                      </span>
                    </span>
                    <span className="truncate text-[0.9375rem] font-semibold text-brand-text">
                      {c.job_title}
                      {c.closed_at ? ` · ${t("closedShort")}` : ""}
                    </span>
                    <span className={cn("truncate text-muted-foreground", c.unread > 0 && "font-bold text-foreground")}>{preview}</span>
                  </span>
                  {c.unread > 0 ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-coral px-1.5 text-xs font-extrabold text-[#2e1410] tabular-nums">
                      <span className="sr-only">{t("unread", { count: c.unread })}</span>
                      <span aria-hidden>{c.unread}</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
