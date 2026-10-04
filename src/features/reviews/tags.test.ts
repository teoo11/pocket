import { describe, expect, it } from "vitest"

import { topTags } from "./tags"

describe("topTags", () => {
  it("counts tags across reviews, most frequent first, ties alphabetical", () => {
    const reviews = [{ tags: ["on_time", "friendly"] }, { tags: ["on_time"] }, { tags: null }, { tags: ["careful", "friendly", "on_time"] }]
    expect(topTags(reviews)).toEqual([
      { tag: "on_time", count: 3 },
      { tag: "friendly", count: 2 },
      { tag: "careful", count: 1 },
    ])
  })
  it("keeps only the top few", () => {
    expect(topTags([{ tags: ["a", "b", "c", "d", "e"] }], 2)).toHaveLength(2)
  })
})
