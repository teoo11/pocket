import { addDays, dayOfWeek } from "@/lib/dates"

import type { CategoryKey } from "./categories"
import { hasBlockedWords, normalizeText } from "./safety"

/**
 * Reads what people write in "Tell us what you need" (English or Romanian) and pre-fills the next
 * posting steps: kind of job, a suggested title, day, time, length and pay. Ported from the prototype's
 * parseJob, with Romanian added. Everything is a suggestion the person can change.
 */
export type SuggestedTitle =
  | "walkDog"
  | "feedCat"
  | "petHelp"
  | "phoneHelp"
  | "tabletHelp"
  | "techHelp"
  | "computerHelp"
  | "mathsHelp"
  | "homeworkHelp"
  | "carryBoxes"
  | "waterPlants"
  | "quickErrand"
  | "houseHelp"
  | "creativeHelp"

export type ParsedJob = {
  category?: CategoryKey
  title?: SuggestedTitle
  date?: string
  startMin?: number
  durMin?: number
  payLei?: number
  blocked: boolean
}

// Matched against lower-case text without diacritics. \b is avoided where Romanian words continue.
const CATEGORY_PATTERNS: [CategoryKey, RegExp][] = [
  ["pet", /\b(dogs?|cats?|pets?|puppy|kitten|feed|caine|caini|catel|pisic|animal|hranesc|hrana)/],
  ["tech", /\b(phone|tablet|wi-?fi|smart ?tv|app|whatsapp|telefon|tablet|televizor|aplicati)/],
  ["computer", /\b(computer|laptop|printer|email|pc|calculator|imprimant)\b/],
  ["tutoring", /\b(math|maths|homework|tutor|english|lesson|study|test|matematic|mate|teme|meditati|lectii|lectie|engleza|scoala)/],
  ["carrying", /\b(box|boxes|carry|move|moving|bags|furniture|cutii|cutie|caras|mutat|muta |sacose|mobila)/],
  ["plants", /\b(plants?|garden|flowers|watering|plante|planta|gradin|flori|udat)/],
  ["errands", /\b(shop|groceries|pharmacy|post office|errand|pick up|bread|cumparaturi|farmacie|posta|paine|magazin|piata)/],
  ["household", /\b(clean|tidy|dishes|laundry|shelf|curtain|curat|spal|vase|rufe|raft|perdea|draperi)/],
  ["creative", /\b(draw|paint|poster|decorat|photo|desen|pict|afis|decor|foto)/],
]

function suggestTitle(category: CategoryKey, t: string): SuggestedTitle | undefined {
  switch (category) {
    case "pet":
      if (/(walk|plimb)/.test(t) && /(dog|cain|catel)/.test(t)) return "walkDog"
      return /(cat|pisic)/.test(t) ? "feedCat" : "petHelp"
    case "tech":
      if (/(phone|telefon)/.test(t)) return "phoneHelp"
      return /tablet/.test(t) ? "tabletHelp" : "techHelp"
    case "computer":
      return "computerHelp"
    case "tutoring":
      return /(math|matematic|\bmate\b)/.test(t) ? "mathsHelp" : "homeworkHelp"
    case "carrying":
      return "carryBoxes"
    case "plants":
      return "waterPlants"
    case "errands":
      return "quickErrand"
    case "household":
      return "houseHelp"
    case "creative":
      return "creativeHelp"
    default:
      return undefined
  }
}

const WEEKDAYS: [RegExp, number][] = [
  [/\b(sunday|duminica)\b/, 0],
  [/\b(monday|luni)\b/, 1],
  [/\b(tuesday|marti)\b/, 2],
  [/\b(wednesday|miercuri)\b/, 3],
  [/\b(thursday|joi)\b/, 4],
  [/\b(friday|vineri)\b/, 5],
  [/\b(saturday|sambata)\b/, 6],
]

function parseDay(t: string, today: string): string | undefined {
  if (/\b(today|tonight|azi|astazi|diseara)\b/.test(t)) return today
  if (/\bpoimaine\b/.test(t)) return addDays(today, 2)
  if (/\b(tomorrow|maine)\b/.test(t)) return addDays(today, 1)
  for (const [re, weekday] of WEEKDAYS) {
    if (re.test(t)) return addDays(today, (weekday - dayOfWeek(today) + 7) % 7 || 7)
  }
  return undefined
}

function parseStart(t: string): number | undefined {
  let m = /(\d{1,2})[:.](\d{2})/.exec(t)
  if (m && +m[1] < 24 && +m[2] < 60) return +m[1] * 60 + +m[2]
  m = /(\d{1,2})\s*(am|pm)\b/.exec(t)
  if (m) return ((+m[1] % 12) + (m[2] === "pm" ? 12 : 0)) * 60
  // "at 5", "around 5", "la 5", "pe la 5", "in jur de 5", "ora 17": small numbers mean the afternoon.
  m = /(?:\bat|\baround|\bby|\babout|\bla|\bora|\bin jur de)\s+(\d{1,2})\b(?!\s*(?:min|hour|ore|ora|lei|ron))/.exec(t)
  if (m && +m[1] < 24) return (+m[1] <= 8 ? +m[1] + 12 : +m[1]) * 60
  return undefined
}

function parseDuration(t: string): number | undefined {
  if (/half an hour|half hour|jumatate de ora|o jumatate de ora/.test(t)) return 30
  let m = /(\d+)\s*(?:min|minutes|minute)\b/.exec(t)
  if (m) return +m[1]
  m = /(\d+)\s*(?:hours?|ore)\b/.exec(t)
  if (m) return +m[1] * 60
  if (/\b(an hour|one hour|o ora|1 ora)\b/.test(t)) return 60
  return undefined
}

export function parseJob(text: string, today: string): ParsedJob {
  const t = normalizeText(text)
  const out: ParsedJob = { blocked: hasBlockedWords(text) }

  const hit = CATEGORY_PATTERNS.find(([, re]) => re.test(t))
  if (hit) {
    out.category = hit[0]
    out.title = suggestTitle(hit[0], t)
  }
  const date = parseDay(t, today)
  if (date) out.date = date
  const start = parseStart(t)
  if (start !== undefined) out.startMin = start
  const dur = parseDuration(t)
  if (dur !== undefined && dur >= 5 && dur <= 600) out.durMin = dur
  const pay = /(\d+)\s*(lei|ron)\b/.exec(t)
  if (pay) out.payLei = +pay[1]
  return out
}

/** What people usually pay, rounded to 5 lei (the prototype's suggestPay). */
export function suggestPay(category: CategoryKey | null | undefined, durMin: number): number {
  const ratePerHour: Partial<Record<CategoryKey, number>> = { tutoring: 50, tech: 55, computer: 55, carrying: 55 }
  const rate = (category && ratePerHour[category]) || 48
  return Math.max(10, Math.round((durMin * rate) / 60 / 5) * 5)
}
