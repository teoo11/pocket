import { Bell, Check, CircleX, Coins, Hand, MapPin, Star, Trophy, Wrench, type LucideIcon } from "lucide-react"

import type { Tone } from "@/lib/tones"

/** Notification types written by the database (supabase/migrations/*_lifecycle.sql). Texts: messages `notifications.<type>`. */
export const NOTIFICATION_STYLE: Record<string, { icon: LucideIcon; tone: Tone }> = {
  new_job_near: { icon: MapPin, tone: "sky" },
  offer_received: { icon: Hand, tone: "sun" },
  offer_declined: { icon: CircleX, tone: "grey" },
  picked: { icon: Check, tone: "brand" },
  job_started: { icon: Wrench, tone: "sky" },
  job_done: { icon: Check, tone: "brand" },
  job_confirmed: { icon: Trophy, tone: "sun" },
  payment_received: { icon: Coins, tone: "sage" },
  review_received: { icon: Star, tone: "sun" },
  job_cancelled: { icon: CircleX, tone: "grey" },
}

export function styleFor(type: string) {
  return NOTIFICATION_STYLE[type] ?? { icon: Bell, tone: "grey" as Tone }
}

/** Parameters for the message templates (title, name, amount, …), as strings or numbers only. */
export function paramsOf(data: unknown): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (data && typeof data === "object") {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (typeof v === "string" || typeof v === "number") out[k] = v
    }
  }
  return out
}
