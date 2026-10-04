/** Review tags (keys; labels in messages `review.tags`). Checked again in SQL (reviews_tags_check). */
export const HELPER_TAGS = ["on_time", "friendly", "careful", "great_job"] as const
export const POSTER_TAGS = ["clear_instructions", "friendly", "paid_on_time", "was_ready"] as const

/** The most given tags, most frequent first: "Known for: On time ×5". */
export function topTags(reviews: { tags: string[] | null }[], limit = 4): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of reviews) for (const tag of r.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit)
}
