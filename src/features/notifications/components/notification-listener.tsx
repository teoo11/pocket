"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useBroadcast } from "@/lib/realtime"

import { paramsOf } from "../types"

type NotificationPayload = { id: number; type: string; data: unknown; link: string | null }
type ChatPayload = { conversation_id: string; sender_name: string | null; body: string }

/**
 * Live updates on the user:<id> channel: notifications (a toast you can tap, a refreshed bell count) and
 * chat pings (a toast and the Messages badge; nothing while that conversation is already open).
 */
export function NotificationListener({ userId }: { userId: string }) {
  const t = useTranslations("notifications")
  const tc = useTranslations("chat")
  const router = useRouter()
  const pathname = usePathname()

  useBroadcast<NotificationPayload | ChatPayload>(`user:${userId}`, ["notification", "chat"], (payload, event) => {
    if (event === "chat") {
      const m = payload as ChatPayload
      const link = `/messages/${m.conversation_id}`
      if (pathname === link) return
      toast(tc("newFrom", { name: m.sender_name ?? tc("someone") }), {
        description: m.body,
        action: { label: tc("reply"), onClick: () => router.push(link) },
      })
      router.refresh()
      return
    }
    const n = payload as NotificationPayload
    const key = t.has(`${n.type}.title`) ? n.type : "generic"
    const params = paramsOf(n.data)
    toast(t(`${key}.title`, params), {
      description: t(`${key}.body`, params),
      action: n.link ? { label: t("open"), onClick: () => router.push(n.link!) } : undefined,
    })
    router.refresh()
  })
  return null
}
