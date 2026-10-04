import "server-only"

import { todayYmd, ymOf } from "@/lib/dates"
import { createClient } from "@/lib/supabase/server"

export type RankBy = "points" | "jobs" | "time"

/** period: "all" or "YYYY-MM" (month of confirmation, Bucharest time). */
export async function getLeaderboard(period: string, by: RankBy = "points", limit = 100) {
  const supabase = await createClient()
  const { data } = await supabase.rpc("leaderboard", { p_period: period, p_by: by, p_limit: limit })
  return data ?? []
}

export function currentMonth(): string {
  return ymOf(todayYmd())
}
