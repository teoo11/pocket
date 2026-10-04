"use client"

import { useEffect, useRef } from "react"

import { createClient } from "@/lib/supabase/client"

/**
 * Listens to one event on a private Broadcast channel (see supabase/migrations/*_realtime.sql:
 * user:<id>, conversation:<id>, job:<id>). Who may listen is checked by RLS on realtime.messages,
 * so the socket is authorised with the signed-in session first.
 * One hook per topic: pass several events as an array (a second hook on the same topic would share its channel).
 * `onSubscribed` runs each time the channel (re)connects: anything sent before that was missed, so pages re-read.
 */
export function useBroadcast<T = Record<string, unknown>>(
  topic: string | null,
  event: string | readonly string[],
  onMessage: (payload: T, event: string) => void,
  onSubscribed?: () => void,
) {
  const events = typeof event === "string" ? event : event.join(",")
  const handler = useRef(onMessage)
  const subscribed = useRef(onSubscribed)
  useEffect(() => {
    handler.current = onMessage
    subscribed.current = onSubscribed
  })

  useEffect(() => {
    if (!topic) return
    const supabase = createClient()
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      await supabase.realtime.setAuth()
      if (cancelled) return
      channel = supabase.channel(topic, { config: { private: true } })
      for (const name of events.split(",")) {
        channel.on("broadcast", { event: name }, (msg) => {
          if (process.env.NODE_ENV === "development") console.debug(`[realtime] ${topic}: received ${name}`)
          handler.current(msg.payload as T, name)
        })
      }
      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") subscribed.current?.()
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.warn(`[realtime] ${topic}: ${status}`, err?.message ?? "")
        if (process.env.NODE_ENV === "development") console.debug(`[realtime] ${topic}: ${status}`)
      })
    })()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [topic, events])
}
