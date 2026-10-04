"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { TONE_CLASSES, type Tone } from "@/lib/tones"
import { cn } from "@/lib/utils"

import { markAllRead, markRead } from "../actions"
import { styleFor } from "../types"

export function NotificationItem({
  id,
  unread,
  href,
  type,
  tone,
  title,
  body,
  when,
}: {
  id: number
  unread: boolean
  href: string
  type: string
  tone: Tone
  title: string
  body: string
  when: string
}) {
  const Icon = styleFor(type).icon
  return (
    <li>
      <Link
        href={href}
        onClick={() => unread && markRead(id)}
        className={cn(
          "flex items-start gap-3 border-[1.6px] border-border bg-card px-4 py-3 text-foreground no-underline hover:bg-wm-tile",
          unread && "border-2 border-primary",
        )}
      >
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-[0.625rem]", TONE_CLASSES[tone])}>
          <Icon className="size-[1.125rem]" strokeWidth={1.7} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col">
          <b>{title}</b>
          <span className="text-muted-foreground">{body}</span>
          <span className="text-sm text-faint">{when}</span>
        </span>
      </Link>
    </li>
  )
}

export function MarkAllReadButton() {
  const t = useTranslations("notifications")
  const [pending, startTransition] = useTransition()
  return (
    <Button variant="link" disabled={pending} onClick={() => startTransition(() => markAllRead())}>
      {t("markAll")}
    </Button>
  )
}
