import { describe, expect, it } from "vitest"

import { activeFilters, PAGE_SIZE, parseSearch, SEARCH_DEFAULTS, searchArgs, searchHref, searchQuery } from "./search-params"

describe("search params", () => {
  it("an empty URL is the default search: nearest first, examples on, list", () => {
    expect(parseSearch({})).toEqual(SEARCH_DEFAULTS)
    expect(SEARCH_DEFAULTS.sort).toBe("near")
    expect(SEARCH_DEFAULTS.examples).toBe(true)
    expect(searchQuery(SEARCH_DEFAULTS)).toBe("")
  })

  it("round-trips every field", () => {
    const state = parseSearch({ q: " dog ", cat: "pet", dist: "2000", minPay: "30", when: "weekend", sort: "pay", examples: "0", view: "map", limit: "120" })
    expect(state).toEqual({ q: "dog", cat: "pet", dist: 2000, minPay: 30, when: "weekend", sort: "pay", examples: false, view: "map", limit: 120 })
    expect(parseSearch(Object.fromEntries(new URLSearchParams(searchQuery(state))))).toEqual(state)
  })

  it("ignores values it doesn't know", () => {
    expect(parseSearch({ cat: "cars", dist: "7", sort: "random", view: "grid", limit: "-5", when: ["today", "week"] })).toEqual({
      ...SEARCH_DEFAULTS,
      when: "today",
    })
    expect(parseSearch({ limit: "99999" }).limit).toBe(300)
    expect(parseSearch({ limit: "130" }).limit).toBe(120)
    expect(parseSearch({ q: "x".repeat(200) }).q).toHaveLength(80)
  })

  it("a changed filter starts again from the first page; Show more keeps it", () => {
    const state = { ...SEARCH_DEFAULTS, limit: 180 }
    expect(searchHref(state, { cat: "tech" })).toBe("/?cat=tech")
    expect(searchHref(state, { limit: 240 })).toBe("/?limit=240")
    expect(searchHref(SEARCH_DEFAULTS)).toBe("/")
  })

  it("counts the filters that narrow the results (not the sort or the view)", () => {
    expect(activeFilters({ ...SEARCH_DEFAULTS, sort: "soon", view: "map", cat: "pet" })).toEqual([])
    expect(activeFilters({ ...SEARCH_DEFAULTS, dist: 1000, examples: false })).toEqual(["dist", "examples"])
  })

  it("maps to the database search arguments", () => {
    expect(searchArgs({ ...SEARCH_DEFAULTS, q: "cat", minPay: 20 }, { lat: 44.45, lng: 26.1 })).toEqual({
      p_q: "cat",
      p_max_dist_m: undefined,
      p_min_pay: 20,
      p_when: "any",
      p_examples: true,
      p_lat: 44.45,
      p_lng: 26.1,
    })
    expect(PAGE_SIZE).toBe(60)
  })
})
