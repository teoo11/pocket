import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { EmptyState } from "@/features/jobs/components/job-bits"
import { MarkAllReadButton, NotificationItem } from "@/features/notifications/components/notification-item"
import { getNotifications } from "@/features/notifications/queries"
import { paramsOf, styleFor } from "@/features/notifications/types"
import { requireViewer } from "@/features/profiles/queries"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav")
  return { title: t("notifications") }
}

function ago(iso: string, locale: string, now: number) {
  const minutes = Math.round((now - Date.parse(iso)) / 60000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (minutes < 60) return rtf.format(-Math.max(0, minutes), "minute")
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, "hour")
  return rtf.format(-Math.round(hours / 24), "day")
}

export default async function NotificationsPage() {
  const viewer = await requireViewer()
  const t = await getTranslations("notifications")
  const locale = await getLocale()
  const list = await getNotifications(viewer.id)
  const now = new Date().getTime()

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[1.875rem]">{t("title")}</h1>
        {list.some((n) => !n.read_at) ? <MarkAllReadButton /> : null}
      </div>
      {list.length ? (
        <ul className="flex flex-col gap-2">
          {list.map((n) => {
            const key = t.has(`${n.type}.title`) ? n.type : "generic"
            const params = paramsOf(n.data)
            return (
              <NotificationItem
                key={n.id}
                id={n.id}
                unread={!n.read_at}
                href={n.link ?? "/"}
                type={n.type}
                tone={styleFor(n.type).tone}
                title={t(`${key}.title`, params)}
                body={t(`${key}.body`, params)}
                when={ago(n.created_at, locale, now)}
              />
            )
          })}
        </ul>
      ) : (
        <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
      )}
    </Page>
  )
}
