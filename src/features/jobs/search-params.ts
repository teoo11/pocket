import { type CategoryKey, isCategory } from "./categories"

/**
 * The job search on Home lives in the URL, so it survives reloads, the back button and shared links.
 * Defaults are left out of the URL. Pure: used by the server page and the client controls alike.
 */
export const DIST_OPTIONS = [0, 1000, 2000, 5000] as const
export const PAY_OPTIONS = [0, 20, 30, 50] as const
export const WHEN_OPTIONS = ["any", "today", "tomorrow", "week", "weekend"] as const
export const SORT_OPTIONS = ["near", "pay", "soon"] as const
export const VIEW_OPTIONS = ["list", "map"] as const
export const PAGE_SIZE = 60
export const MAX_RESULTS = 300

export type SearchWhen = (typeof WHEN_OPTIONS)[number]
export type SearchSort = (typeof SORT_OPTIONS)[number]
export type SearchView = (typeof VIEW_OPTIONS)[number]

export type SearchState = {
  q: string
  cat: CategoryKey | "all"
  dist: (typeof DIST_OPTIONS)[number]
  minPay: (typeof PAY_OPTIONS)[number]
  when: SearchWhen
  sort: SearchSort
  /** Show the example jobs (on by default). */
  examples: boolean
  view: SearchView
  /** How many results to show ("Show more" adds a page). */
  limit: number
}

export const SEARCH_DEFAULTS: SearchState = {
  q: "",
  cat: "all",
  dist: 0,
  minPay: 0,
  when: "any",
  sort: "near",
  examples: true,
  view: "list",
  limit: PAGE_SIZE,
}

type RawParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const oneOf = <T extends string | number>(value: string | undefined, allowed: readonly T[], fallback: T): T =>
  (allowed.find((a) => String(a) === value) ?? fallback) as T

export function parseSearch(params: RawParams): SearchState {
  const cat = first(params.cat)
  const limit = Number(first(params.limit))
  return {
    q: (first(params.q) ?? "").trim().slice(0, 80),
    cat: isCategory(cat) ? cat : "all",
    dist: oneOf(first(params.dist), DIST_OPTIONS, 0),
    minPay: oneOf(first(params.minPay), PAY_OPTIONS, 0),
    when: oneOf(first(params.when), WHEN_OPTIONS, "any"),
    sort: oneOf(first(params.sort), SORT_OPTIONS, "near"),
    examples: first(params.examples) !== "0",
    view: oneOf(first(params.view), VIEW_OPTIONS, "list"),
    limit: Number.isInteger(limit) && limit > PAGE_SIZE ? Math.min(limit - (limit % PAGE_SIZE), MAX_RESULTS) : PAGE_SIZE,
  }
}

/** The query string for a state (no leading "?"), leaving defaults out. */
export function searchQuery(state: SearchState): string {
  const p = new URLSearchParams()
  if (state.q) p.set("q", state.q)
  if (state.cat !== "all") p.set("cat", state.cat)
  if (state.dist) p.set("dist", String(state.dist))
  if (state.minPay) p.set("minPay", String(state.minPay))
  if (state.when !== "any") p.set("when", state.when)
  if (state.sort !== "near") p.set("sort", state.sort)
  if (!state.examples) p.set("examples", "0")
  if (state.view !== "list") p.set("view", state.view)
  if (state.limit !== PAGE_SIZE) p.set("limit", String(state.limit))
  return p.toString()
}

/** Home with this search; a changed filter starts again from the first page. */
export function searchHref(state: SearchState, patch: Partial<SearchState> = {}): string {
  const next = { ...state, ...patch }
  if (!("limit" in patch)) next.limit = PAGE_SIZE
  const query = searchQuery(next)
  return query ? `/?${query}` : "/"
}

/** Filters that narrow the results (shown as removable chips and counted on the Filters button). */
export const FILTER_KEYS = ["dist", "minPay", "when", "examples"] as const
export type FilterKey = (typeof FILTER_KEYS)[number]

export function activeFilters(state: SearchState): FilterKey[] {
  return FILTER_KEYS.filter((k) => state[k] !== SEARCH_DEFAULTS[k])
}

/** Arguments for public.search_jobs / search_job_counts. */
export function searchArgs(state: SearchState, origin: { lat: number; lng: number } | null) {
  return {
    p_q: state.q || undefined,
    p_max_dist_m: state.dist || undefined,
    p_min_pay: state.minPay || undefined,
    p_when: state.when,
    p_examples: state.examples,
    p_lat: origin?.lat,
    p_lng: origin?.lng,
  }
}
