/**
 * Points and levels (SPEC §8).
 * Points per completed job: floor(minutes / 15) + 1, so a 1-hour job is worth 5 points. (Also in SQL:
 * private.job_points.) Reaching level n+1 takes min(5n, 100) more points: level 2 at 5, 3 at 15, 4 at 30,
 * 5 at 50, 6 at 75, 10 at 225, 20 at 950, 21 at 1,050, then +100 per level with no limit.
 */
export function jobPoints(minutes: number): number {
  return Math.floor(Math.max(0, minutes) / 15) + 1
}

/** Points needed to go from level n to level n+1. */
export function levelGap(n: number): number {
  return Math.min(5 * n, 100)
}

/** Points at which level n starts. */
export function levelStart(n: number): number {
  return n <= 21 ? (5 * (n - 1) * n) / 2 : 1050 + 100 * (n - 21)
}

/** Level names (keys into messages `levels.names`); after the last, "Legend 2", "Legend 3", … */
export const LEVEL_NAME_COUNT = 8

export type Level = {
  n: number
  /** Index into `levels.names` (0–7). */
  nameIndex: number
  /** For n above 8: the number after "Legend" (2, 3, …); otherwise null. */
  legendNumber: number | null
  from: number
  next: number
  toGo: number
  /** Progress through the current level, 0–100. */
  pct: number
}

export function levelOf(points: number): Level {
  const p = Math.max(0, Math.floor(points))
  let n = p >= 1050 ? 21 + Math.floor((p - 1050) / 100) : 1
  while (p >= levelStart(n + 1)) n++
  const from = levelStart(n)
  const next = levelStart(n + 1)
  return {
    n,
    nameIndex: Math.min(n, LEVEL_NAME_COUNT) - 1,
    legendNumber: n > LEVEL_NAME_COUNT ? n - LEVEL_NAME_COUNT + 1 : null,
    from,
    next,
    toGo: next - p,
    pct: Math.round(((p - from) / (next - from)) * 100),
  }
}
