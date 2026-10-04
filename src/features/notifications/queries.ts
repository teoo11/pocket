import "server-only"

import { getMyJobs, needsYouCount } from "@/features/jobs/queries"
import { createClient } from "@/lib/supabase/server"

/** The bell's unread count and the My jobs "needs you" badge. */
export async function getShellCounts(viewerId: string) {
  const supabase = await createClient()
  const [{ count }, my, { data: stats }, { data: chats }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", viewerId).is("read_at", null),
    getMyJobs(viewerId),
    supabase.from("profile_stats").select("points").eq("user_id", viewerId).maybeSingle(),
    supabase.rpc("unread_conversations"),
  ])
  return { unread: count ?? 0, needsYou: needsYouCount(my), points: stats?.points ?? 0, chats: chats ?? 0 }
}

export async function getNotifications(viewerId: string, limit = 50) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("notifications")
    .select("id, type, data, link, read_at, created_at")
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}
