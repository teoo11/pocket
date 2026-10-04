import { dayDiff, ymdToDate } from "./dates"

/** Pocket's English is British (the prototype wrote "Sat 4 Oct", 24-hour times). */
export function intlLocale(locale: string): string {
  return locale === "en" ? "en-GB" : locale
}

/** Distances as the prototype showed them: "300 m", "1.2 km" (Romanian: "1,2 km"). */
export function fmtDist(meters: number, locale: string): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  const km = Math.round(meters / 100) / 10
  return `${new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(km)} km`
}

/** "30 min", "1 h", "1 h 30 min" (the same in English and Romanian). */
export function fmtDur(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h} h${r ? ` ${r} min` : ""}`
}

/** Lei with the locale's separators; whole amounts without decimals ("1,234 lei" / "1.234 lei"). */
export function fmtLei(lei: number, locale: string): string {
  const whole = Number.isInteger(lei)
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(lei)
}

export type RelativeDayWords = { today: string; tomorrow: string; yesterday: string }

/**
 * "Today", "Tomorrow", "Yesterday", a weekday name within the next 6 days, otherwise "Sat 4 Oct".
 * `words` come from the messages so they follow the reader's language.
 */
export function dayLabel(ymd: string, today: string, locale: string, words: RelativeDayWords): string {
  const n = dayDiff(today, ymd)
  if (n === 0) return words.today
  if (n === 1) return words.tomorrow
  if (n === -1) return words.yesterday
  const date = ymdToDate(ymd)
  if (n > 1 && n < 7) return capitalize(new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", timeZone: "UTC" }).format(date))
  return capitalize(
    new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
      .format(date)
      .replace(",", ""),
  )
}

/** "4 Oct" / "4 oct." */
export function shortDate(ymd: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" }).format(ymdToDate(ymd))
}

/** "Saturday, 4 October" */
export function longDate(ymd: string, locale: string): string {
  return capitalize(
    new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
      ymdToDate(ymd),
    ),
  )
}

export function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase() + s.slice(1)
}

/** First letter of a name, for avatar fallbacks. */
export function initial(name: string | null | undefined): string {
  return (name?.trim().charAt(0) || "?").toLocaleUpperCase()
}
