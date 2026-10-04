import { dayOfWeek } from "@/lib/dates"

/** Weekday ("0" = Sunday … "6") -> [from, to] in minutes after midnight, or null when not available. */
export type Schedule = Partial<Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", [number, number] | null>>

export const EVERY_DAY: Schedule = {
  0: [480, 1260],
  1: [480, 1260],
  2: [480, 1260],
  3: [480, 1260],
  4: [480, 1260],
  5: [480, 1260],
  6: [480, 1260],
}

/** Does a job on `ymd` from `startMin` for `durMin` fit inside the person's hours for that weekday? */
export function fitsSchedule(schedule: Schedule | null | undefined, ymd: string, startMin: number, durMin: number): boolean {
  const window = schedule?.[String(dayOfWeek(ymd)) as keyof Schedule]
  return !!window && startMin >= window[0] && startMin + durMin <= window[1]
}

export function asSchedule(value: unknown): Schedule {
  if (!value || typeof value !== "object") return {}
  const out: Schedule = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[0-6]$/.test(k)) continue
    if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number")) {
      out[k as keyof Schedule] = [v[0], v[1]]
    } else {
      out[k as keyof Schedule] = null
    }
  }
  return out
}
