"use client"

import { SendHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ReportButton } from "@/features/moderation/components/report-button"
import { todayYmd } from "@/lib/dates"
import { dayLabel, intlLocale } from "@/lib/format"
import { useBroadcast } from "@/lib/realtime"
import { cn } from "@/lib/utils"

import { markConversationRead, sendMessage } from "../actions"
import type { ChatMessage } from "../queries"

type Shown = ChatMessage & { pending?: boolean }

const BUCHAREST = "Europe/Bucharest"

/** Saved messages in id order without duplicates, then the ones still sending (negative ids). */
function mergeMessages(server: ChatMessage[], live: Shown[]): Shown[] {
  const byId = new Map<number, Shown>()
  for (const m of [...server, ...live]) if (m.id > 0) byId.set(m.id, m)
  return [...[...byId.values()].sort((a, b) => a.id - b.id), ...live.filter((m) => m.id < 0)]
}

/**
 * A live conversation: messages arrive on the private conversation:<id> channel; what I send shows at once
 * and is replaced by the saved row. Closed conversations are read-only.
 */
export function ChatThread({
  conversationId,
  viewerId,
  initial,
  closed,
}: {
  conversationId: string
  viewerId: string
  initial: ChatMessage[]
  closed: boolean
}) {
  const t = useTranslations("chat")
  const tTime = useTranslations("time")
  const tErr = useTranslations("errors")
  const locale = useLocale()
  const router = useRouter()
  // Server-read messages (refreshed on reconnect) plus what arrived live or is being sent.
  const [live, setLive] = useState<Shown[]>([])
  const messages = mergeMessages(initial, live)
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)
  const tempId = useRef(-1)

  // Opening the conversation reads it; refresh once so the Messages badge drops.
  useEffect(() => {
    void markConversationRead(conversationId).then(() => router.refresh())
  }, [conversationId, router])

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  useBroadcast<ChatMessage>(
    `conversation:${conversationId}`,
    "message",
    (m) => {
      setLive((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]))
      if (m.sender_id !== viewerId) void markConversationRead(conversationId)
    },
    () => router.refresh(),
  )

  const send = () => {
    const body = draft.trim()
    if (!body || pending) return
    const temp: Shown = { id: tempId.current--, sender_id: viewerId, body, created_at: new Date().toISOString(), pending: true }
    setLive((list) => [...list, temp])
    setDraft("")
    startTransition(async () => {
      const r = await sendMessage({ conversationId, body })
      if (!r.ok) {
        setLive((list) => list.filter((x) => x.id !== temp.id))
        setDraft(body)
        toast.error(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
        return
      }
      const saved = r.data!
      // The broadcast may have delivered the saved row already.
      setLive((list) =>
        list.some((x) => x.id === saved.id) ? list.filter((x) => x.id !== temp.id) : list.map((x) => (x.id === temp.id ? saved : x)),
      )
    })
  }

  const time = new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit", timeZone: BUCHAREST })
  const ymd = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: BUCHAREST })
  const today = todayYmd()
  const words = { today: tTime("today"), tomorrow: tTime("tomorrow"), yesterday: tTime("yesterday") }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ol className="flex flex-col gap-1.5" aria-label={t("messages")} aria-live="polite">
        {messages.length === 0 ? <li className="py-8 text-center text-muted-foreground">{t("startHint")}</li> : null}
        {messages.map((m, i) => {
          const mine = m.sender_id === viewerId
          const newDay = i === 0 || ymd(messages[i - 1].created_at) !== ymd(m.created_at)
          return (
            <li key={m.id} className="flex flex-col">
              {newDay ? (
                <span className="my-3 self-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-muted-foreground">
                  {dayLabel(ymd(m.created_at), today, locale, words)}
                </span>
              ) : null}
              <div className={cn("group flex max-w-[85%] items-end gap-1", mine ? "flex-row-reverse self-end" : "self-start")}>
                <div
                  className={cn(
                    "rounded-[1.25rem] px-4 py-2.5 text-[1.0625rem] break-words whitespace-pre-wrap",
                    mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border-[1.6px] border-border bg-card",
                    m.pending && "opacity-70",
                  )}
                >
                  <span className="sr-only">{mine ? t("you") : t("them")}: </span>
                  {m.body}
                  <span className={cn("ml-2 inline-block text-xs tabular-nums", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {m.pending ? t("sending") : time.format(new Date(m.created_at))}
                  </span>
                </div>
                {!mine && m.id > 0 ? (
                  <ReportButton kind="message" targetId={String(m.id)} label={t("reportMessage")} iconOnly className="size-9 opacity-60 group-hover:opacity-100" />
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
      <div ref={endRef} />

      {closed ? (
        <p className="rounded-2xl bg-secondary px-4 py-3 text-center text-muted-foreground">{t("closed")}</p>
      ) : (
        <form
          className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] flex items-end gap-2 rounded-[1.25rem] border-[1.6px] border-border bg-card p-2 shadow-wm-xs desk:bottom-4"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <label htmlFor="chat-draft" className="sr-only">
            {t("write")}
          </label>
          <Textarea
            id="chat-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={t("placeholder")}
            maxLength={2000}
            rows={1}
            className="max-h-40 min-h-12 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon" disabled={!draft.trim()} aria-label={t("send")}>
            <SendHorizontal aria-hidden />
          </Button>
        </form>
      )}
    </div>
  )
}
