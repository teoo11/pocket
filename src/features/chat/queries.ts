import "server-only"

import { createClient } from "@/lib/supabase/server"

export type InboxItem = Awaited<ReturnType<typeof getInbox>>[number]
export type ChatMessage = { id: number; sender_id: string | null; body: string; created_at: string }

/** My conversations, newest first (public.my_conversations). */
export async function getInbox() {
  const supabase = await createClient()
  const { data } = await supabase.rpc("my_conversations")
  return data ?? []
}

/** How many conversations have messages I haven't read, for the top-bar badge. */
export async function getUnreadConversations(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("unread_conversations")
  return data ?? 0
}

/** One conversation with its job, the other person and the latest messages (oldest first). RLS: only its two people. */
export async function getConversation(id: string, viewerId: string, limit = 200) {
  const supabase = await createClient()
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, job_id, poster_id, helper_id, closed_at, jobs(title, status)")
    .eq("id", id)
    .maybeSingle()
  if (!convo) return null
  const otherId = convo.poster_id === viewerId ? convo.helper_id : convo.poster_id
  const [{ data: other }, { data: messages }] = await Promise.all([
    otherId
      ? supabase.from("profiles").select("id, display_name, avatar_path, is_example").eq("id", otherId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("chat_messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", id)
      .order("id", { ascending: false })
      .limit(limit),
  ])
  return {
    id: convo.id,
    jobId: convo.job_id,
    jobTitle: convo.jobs?.title ?? null,
    jobStatus: convo.jobs?.status ?? null,
    iAmPoster: convo.poster_id === viewerId,
    closed: convo.closed_at !== null,
    other,
    messages: ((messages ?? []) as ChatMessage[]).reverse(),
  }
}

/** For a job page: my conversations about this job, by helper id (the poster has one per helper who offered). */
export async function getJobConversations(jobId: string): Promise<Map<string, { id: string; closed: boolean }>> {
  const supabase = await createClient()
  const { data } = await supabase.from("conversations").select("id, helper_id, closed_at").eq("job_id", jobId)
  return new Map((data ?? []).filter((c) => c.helper_id).map((c) => [c.helper_id!, { id: c.id, closed: c.closed_at !== null }]))
}
