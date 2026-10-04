import type { CategoryKey } from "./categories"

/** Any part of the job falls between 22:00 and 06:00 (night work is not allowed under 18). */
export function isNight(startMin: number, durMin: number): boolean {
  return startMin < 360 || startMin + durMin > 1320
}

export type MinorsWarning = "night" | "heavy" | "default"

/** Which "Under 18?" note a job shows: the stronger ones for night and heavy (carrying) work. */
export function minorsWarning(job: { category: CategoryKey; start_min: number; dur_min: number }): MinorsWarning {
  if (isNight(job.start_min, job.dur_min)) return "night"
  if (job.category === "carrying") return "heavy"
  return "default"
}

/** Lower case, Romanian diacritics removed (ș → s), like private.f_unaccent(lower(...)) in SQL. */
export function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

/**
 * Words that are not allowed in a job, English and Romanian. Must match private.has_blocked_words
 * in supabase/migrations/*_foundation.sql: the database is what enforces it, this is for instant feedback.
 */
const BLOCKED =
  /(?<![\p{L}\p{N}])(overnight|alcohol|cigarettes?|drugs?|weapons?|massage|secret|don'?t tell|bank card|pin code|peste noapte|alcool|tigari|tigara|droguri|drog|arma|arme|masaj|nu spune|card bancar|cod pin)(?![\p{L}\p{N}])/u

export function hasBlockedWords(text: string): boolean {
  return BLOCKED.test(normalizeText(text))
}
