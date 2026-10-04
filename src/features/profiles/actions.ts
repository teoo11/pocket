"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { type ActionResult, rpcErrorKey } from "@/lib/rpc-errors"
import { createClient } from "@/lib/supabase/server"

import { homeSchema, onboardingSchema, privateSettingsSchema, profileSettingsSchema } from "./schemas"

export type OnboardingState = { error?: string }

export async function completeOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    homeLabel: formData.get("homeLabel"),
    phone: formData.get("phone") ?? "",
    locale: formData.get("locale"),
  })
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]
    return { error: field === "name" ? "invalid_name" : field === "phone" ? "invalid_phone" : field === "locale" ? "invalid_input" : "place_required" }
  }
  const d = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.rpc("complete_onboarding", {
    p_display_name: d.name,
    p_lat: d.lat,
    p_lng: d.lng,
    p_home_label: d.homeLabel,
    p_phone: d.phone,
    p_locale: d.locale,
  })
  if (error) return { error: rpcErrorKey(error) }
  redirect("/")
}

export async function setHome(input: { lat: number; lng: number; homeLabel: string }): Promise<ActionResult> {
  const parsed = homeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_home", {
    p_lat: parsed.data.lat,
    p_lng: parsed.data.lng,
    p_label: parsed.data.homeLabel,
  })
  if (error) return { ok: false, error: rpcErrorKey(error) }
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Public profile settings: name, about me, what I help with, how far, when. */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims.sub) return { ok: false, error: "not_signed_in" }
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", claims.claims.sub)
  if (error) return { ok: false, error: rpcErrorKey(error) }
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Private settings: phone and savings goal. */
export async function updatePrivate(input: unknown): Promise<ActionResult> {
  const parsed = privateSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message === "phoneInvalid" ? "invalid_phone" : "invalid_input" }
  const { phone, ...rest } = parsed.data
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims.sub) return { ok: false, error: "not_signed_in" }
  const { error } = await supabase
    .from("profile_private")
    .update({ ...rest, ...(phone !== undefined ? { phone: phone || null } : {}) })
    .eq("user_id", claims.claims.sub)
  if (error) return { ok: false, error: rpcErrorKey(error) }
  revalidatePath("/me", "layout")
  return { ok: true }
}

/** Remembers the level the person has seen, so the level-up pop-up shows once per level. */
export async function markLevelSeen(level: number): Promise<void> {
  if (!Number.isInteger(level) || level < 1 || level > 10000) return
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims.sub) return
  await supabase.from("profile_private").update({ last_seen_level: level }).eq("user_id", claims.claims.sub)
}

/** Saves a new profile photo path (uploaded by the browser to avatars/<my id>/…). */
export async function updateAvatar(path: string | null): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims.sub
  if (!uid) return { ok: false, error: "not_signed_in" }
  const ownFile = /^[A-Za-z0-9_-]{1,40}\.(webp|jpg|jpeg|png)$/
  if (path !== null && !(path.startsWith(`${uid}/`) && ownFile.test(path.slice(uid.length + 1)))) {
    return { ok: false, error: "invalid_input" }
  }
  const { data: old } = await supabase.from("profiles").select("avatar_path").eq("id", uid).single()
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", uid)
  if (error) return { ok: false, error: rpcErrorKey(error) }
  if (old?.avatar_path && old.avatar_path !== path) await supabase.storage.from("avatars").remove([old.avatar_path])
  revalidatePath("/", "layout")
  return { ok: true }
}
