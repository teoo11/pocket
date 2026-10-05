import "server-only"

import { cookies } from "next/headers"

import { inServiceArea } from "@/features/maps/places"

/**
 * Where job distances are measured from. By default the viewer's home (null here: the database uses it);
 * "Near me now" keeps the phone's position, rounded to about 100 m, in a short session cookie, never in a URL.
 */
export const ORIGIN_COOKIE = "pocket-near"
export const ORIGIN_MAX_AGE_S = 2 * 60 * 60

export type SearchOrigin = { lat: number; lng: number }

export function parseOrigin(value: string | undefined): SearchOrigin | null {
  const m = /^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/.exec(value ?? "")
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  return inServiceArea(lat, lng) ? { lat, lng } : null
}

export async function getSearchOrigin(): Promise<SearchOrigin | null> {
  return parseOrigin((await cookies()).get(ORIGIN_COOKIE)?.value)
}
