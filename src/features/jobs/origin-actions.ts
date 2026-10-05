"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"

import { inServiceArea } from "@/features/maps/places"
import type { ActionResult } from "@/lib/rpc-errors"

import { ORIGIN_COOKIE, ORIGIN_MAX_AGE_S } from "./origin"

const pointSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })

/** "Near me now": measure distances from here for this visit (about 100 m precision, 2 hours at most). */
export async function setSearchOrigin(input: z.input<typeof pointSchema>): Promise<ActionResult> {
  const parsed = pointSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const lat = Math.round(parsed.data.lat * 1000) / 1000
  const lng = Math.round(parsed.data.lng * 1000) / 1000
  if (!inServiceArea(lat, lng)) return { ok: false, error: "outside_area" }
  ;(await cookies()).set(ORIGIN_COOKIE, `${lat.toFixed(3)},${lng.toFixed(3)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORIGIN_MAX_AGE_S,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Back to measuring from home. */
export async function clearSearchOrigin(): Promise<void> {
  ;(await cookies()).delete(ORIGIN_COOKIE)
  revalidatePath("/", "layout")
}
