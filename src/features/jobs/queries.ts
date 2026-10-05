import "server-only"

import { cache } from "react"

import type { Tables } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

import type { CategoryKey } from "./categories"
import { needsAction, type OfferStatus, type ViewerContext } from "./lifecycle"
import type { SearchOrigin } from "./origin"
import { searchArgs, type SearchState } from "./search-params"

export type JobCard = Tables<"job_cards"> & { id: string; status: NonNullable<Tables<"job_cards">["status"]> }

const CARD_COLUMNS = "*"

function asCards(rows: Tables<"job_cards">[] | null): JobCard[] {
  return (rows ?? []).filter((r): r is JobCard => !!r.id && !!r.status)
}

/** Everything about "my jobs" in one go: what I posted, what I help with, and my offers. Once per request. */
export const getMyJobs = cache(async (viewerId: string) => {
  const supabase = await createClient()
  const [posted, helping, myOffers, myReviews] = await Promise.all([
    supabase.from("job_cards").select(CARD_COLUMNS).eq("poster_id", viewerId).order("starts_at", { ascending: true }),
    supabase.from("job_cards").select(CARD_COLUMNS).eq("helper_id", viewerId).order("starts_at", { ascending: true }),
    supabase.from("offers").select("job_id, status, created_at").eq("helper_id", viewerId).order("created_at"),
    supabase.from("reviews").select("job_id").eq("author_id", viewerId),
  ])

  const postedJobs = asCards(posted.data)
  const openIds = postedJobs.filter((j) => j.status === "open").map((j) => j.id)
  const pending = openIds.length
    ? await supabase.from("offers").select("job_id").eq("status", "pending").in("job_id", openIds)
    : { data: [] as { job_id: string }[] }

  const pendingByJob = new Map<string, number>()
  for (const o of pending.data ?? []) pendingByJob.set(o.job_id, (pendingByJob.get(o.job_id) ?? 0) + 1)

  // Latest offer per job wins (people can offer again after withdrawing).
  const offerByJob = new Map<string, OfferStatus>()
  for (const o of myOffers.data ?? []) offerByJob.set(o.job_id, o.status)

  const reviewed = new Set((myReviews.data ?? []).map((r) => r.job_id))

  const helpingJobs = asCards(helping.data)
  const helpingIds = new Set(helpingJobs.map((j) => j.id))
  const offeredIds = [...offerByJob.entries()]
    .filter(([id, status]) => !helpingIds.has(id) && (status === "pending" || status === "declined"))
    .map(([id]) => id)
  const offered = offeredIds.length
    ? asCards((await supabase.from("job_cards").select(CARD_COLUMNS).in("id", offeredIds)).data)
    : []

  const contextFor = (jobId: string): ViewerContext => ({
    viewerId,
    myOffer: offerByJob.get(jobId) ?? null,
    pendingOffers: pendingByJob.get(jobId) ?? 0,
    reviewed: reviewed.has(jobId),
  })

  return { posted: postedJobs, helping: helpingJobs, offered, contextFor, offerByJob, pendingByJob, reviewed }
})

export type MyJobs = Awaited<ReturnType<typeof getMyJobs>>

export function needsYouCount(my: MyJobs): number {
  const all = [...my.posted, ...my.helping]
  return all.filter((j) => needsAction(j, my.contextFor(j.id))).length
}

/**
 * The job search on Home: open, upcoming jobs from other people, filtered, sorted and counted in the database
 * (public.search_jobs / search_job_counts). Distances are from `origin` ("near me now") or else from home.
 */
export async function searchJobs(state: SearchState, origin: SearchOrigin | null): Promise<JobCard[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("search_jobs", {
    ...searchArgs(state, origin),
    p_category: state.cat === "all" ? undefined : state.cat,
    p_sort: state.sort,
    p_limit: state.limit,
  })
  return asCards(data)
}

/** Jobs per category for the chips, with every other filter applied ("All" is the sum). */
export async function searchJobCounts(state: SearchState, origin: SearchOrigin | null): Promise<Partial<Record<CategoryKey, number>>> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("search_job_counts", searchArgs(state, origin))
  return Object.fromEntries((data ?? []).map((r) => [r.category, r.open_count]))
}

/** One job as a card; with an origin, its distance is from there (like the search). */
export async function getJobCard(id: string, origin: SearchOrigin | null = null): Promise<JobCard | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("job_cards_for", { p_ids: [id], p_lat: origin?.lat, p_lng: origin?.lng }).maybeSingle()
  return data && data.id && data.status ? (data as JobCard) : null
}

export async function getOfferCandidates(jobId: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc("offer_candidates", { p_job_id: jobId })
  return data ?? []
}

export async function getJobContact(jobId: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc("job_contact", { p_job_id: jobId })
  return data?.[0] ?? null
}

/** The poster's own exact point and address (job_private is readable by the poster, and the helper after the pick). */
export async function getJobPlace(jobId: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("job_private").select("exact_loc, address").eq("job_id", jobId).maybeSingle()
  const loc = data?.exact_loc as { coordinates?: [number, number] } | null | undefined
  if (!data || !loc?.coordinates) return null
  return { lat: loc.coordinates[1], lng: loc.coordinates[0], address: data.address }
}

/** The job's photos (paths in the job-photos bucket), in the order the poster added them. */
export async function getJobPhotos(jobId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("jobs").select("photo_paths").eq("id", jobId).maybeSingle()
  return data?.photo_paths ?? []
}
