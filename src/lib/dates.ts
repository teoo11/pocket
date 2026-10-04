/**
 * Calendar dates as "YYYY-MM-DD" strings and clock times as minutes after midnight, always in
 * Bucharest time (the server runs in UTC). Date arithmetic is done on UTC midnights, so it never
 * shifts across daylight-saving changes.
 */
export const TIME_ZONE = "Europe/Bucharest"

const ymdFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
const hmFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

/** Today's date in Bucharest. */
export function todayYmd(now: Date = new Date()): string {
  return ymdFormat.format(now)
}

/** Minutes after midnight right now in Bucharest. */
export function nowMinutes(now: Date = new Date()): number {
  const [h, m] = hmFormat.format(now).split(":").map(Number)
  return h * 60 + m
}

function toUtc(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUtc(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(ymd: string, n: number): string {
  const d = toUtc(ymd)
  d.setUTCDate(d.getUTCDate() + n)
  return fromUtc(d)
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(ymd: string): number {
  return toUtc(ymd).getUTCDay()
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function dayDiff(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000)
}

/** The next given weekday after `from` (a week later when `from` is already that weekday). */
export function nextDow(from: string, weekday: number): string {
  return addDays(from, (weekday - dayOfWeek(from) + 7) % 7 || 7)
}

export function isYmd(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtc(value).getTime())
}

/** "17:05" for 1025. */
export function fmtTime(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

/** "17:05" -> 1025; null when it isn't a time. */
export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  return h < 24 && m < 60 ? h * 60 + m : null
}

/** The calendar month of a date in Bucharest, "YYYY-MM". */
export function ymOf(ymd: string): string {
  return ymd.slice(0, 7)
}

/** A JS Date for a calendar day (UTC midnight): only for Intl formatting with timeZone UTC. */
export function ymdToDate(ymd: string): Date {
  return toUtc(ymd)
}
