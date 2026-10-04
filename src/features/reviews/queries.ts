import "server-only"

import { createClient } from "@/lib/supabase/server"

/**
 * The two reviews of one job, from the viewer's side. RLS keeps the other person's review hidden until the viewer
 * has written theirs, or 7 days have passed (double-blind).
 */
export async function getJobReviews(jobId: string, viewerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("reviews")
    .select("id, author_id, subject_role, stars, tags, comment, created_at")
    .eq("job_id", jobId)
  const rows = data ?? []
  return {
    mine: rows.find((r) => r.author_id === viewerId) ?? null,
    theirs: rows.find((r) => r.author_id !== viewerId) ?? null,
  }
}
