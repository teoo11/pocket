import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { publicEnv } from "@/lib/env"
import { getClaims } from "@/lib/supabase/auth"
import type { Tables } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export type Profile = Tables<"profiles">
export type ProfilePrivate = Omit<Tables<"profile_private">, "home"> & { home_lat: number | null; home_lng: number | null }

export type Viewer = {
  id: string
  email: string | null
  profile: Profile
  private: ProfilePrivate
}

/** Public URL of a profile photo in the avatars bucket. */
export function avatarUrl(path: string | null | undefined): string | null {
  return path ? `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null
}

/** GeoJSON or EWKT/hex from PostgREST -> lat/lng. PostGIS geography comes back as GeoJSON. */
function readPoint(value: unknown): { lat: number; lng: number } | null {
  if (value && typeof value === "object" && "coordinates" in value) {
    const [lng, lat] = (value as { coordinates: [number, number] }).coordinates
    return { lat, lng }
  }
  return null
}

/** The signed-in person with their profile and private details, or null. Once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const claims = await getClaims()
  if (!claims?.sub) return null
  const supabase = await createClient()
  const [{ data: profile }, { data: priv }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", claims.sub).maybeSingle(),
    supabase.from("profile_private").select("*").eq("user_id", claims.sub).maybeSingle(),
  ])
  if (!profile || !priv) return null
  const { home, ...rest } = priv
  const point = readPoint(home)
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    profile,
    private: { ...rest, home_lat: point?.lat ?? null, home_lng: point?.lng ?? null },
  }
})

/**
 * For signed-in pages. Pages render in parallel with their layout, so each page checks for itself:
 * signed out -> /login (and back here afterwards), not set up yet -> /onboarding.
 */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) {
    const path = (await headers()).get("x-pocket-path") ?? "/"
    redirect(`/login?next=${encodeURIComponent(path)}`)
  }
  if (!viewer.profile.onboarded_at) redirect("/onboarding")
  return viewer
}

export type PublicProfile = {
  profile: Profile
  stats: Tables<"profile_stats"> | null
}

/** Anyone's public profile and numbers (never earnings). */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const supabase = await createClient()
  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("profile_stats").select("*").eq("user_id", userId).maybeSingle(),
  ])
  return profile ? { profile, stats } : null
}

/** "Jobs completed so far": what the person did as a helper, newest first, with the poster's review. */
export async function getHistory(userId: string, limit = 50) {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from("job_cards")
    .select("id, title, category, category_label, area_label, poster_name, minutes, dur_min, confirmed_at, status")
    .eq("helper_id", userId)
    .in("status", ["completed", "paid"])
    .order("confirmed_at", { ascending: false })
    .limit(limit)
  const ids = (jobs ?? []).map((j) => j.id!).filter(Boolean)
  const { data: reviews } = ids.length
    ? await supabase.from("reviews").select("job_id, stars, tags, comment").in("job_id", ids).eq("subject_role", "helper")
    : { data: [] }
  const byJob = new Map((reviews ?? []).map((r) => [r.job_id, r]))
  return (jobs ?? []).map((j) => ({ ...j, review: byJob.get(j.id!) ?? null }))
}

/** Reviews others left about this person (as helper and as poster), revealed ones only (RLS). */
export async function getReviewsAbout(userId: string, limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("reviews")
    .select("id, job_id, author_id, subject_role, stars, tags, comment, created_at")
    .eq("subject_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
  const authorIds = [...new Set((data ?? []).map((r) => r.author_id).filter((x): x is string => !!x))]
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name, avatar_path").in("id", authorIds)
    : { data: [] }
  const names = new Map((authors ?? []).map((a) => [a.id, a]))
  return (data ?? []).map((r) => ({ ...r, author: r.author_id ? names.get(r.author_id) ?? null : null }))
}
