"use server"

import { revalidatePath } from "next/cache"

import { type ActionResult, rpcErrorKey } from "@/lib/rpc-errors"
import { createClient } from "@/lib/supabase/server"

import { hasBlockedWords } from "../safety"
import { newJobSchema } from "./schema"

export async function createJob(input: unknown): Promise<ActionResult<{ id: string; photosFailed: boolean }>> {
  const parsed = newJobSchema.safeParse(input)
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]
    return { ok: false, error: field === "categoryLabel" ? "category_label_required" : "invalid_input" }
  }
  const d = parsed.data
  if (hasBlockedWords(`${d.title} ${d.description} ${d.categoryLabel}`)) return { ok: false, error: "blocked_words" }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_job", {
    p_category: d.category,
    p_category_label: d.categoryLabel,
    p_title: d.title,
    p_description: d.description,
    p_starts_on: d.date,
    p_start_min: d.startMin,
    p_dur_min: d.durMin,
    p_pay_lei: d.payLei,
    p_lat: d.lat,
    p_lng: d.lng,
    p_address: d.address,
  })
  if (error || !data) return { ok: false, error: rpcErrorKey(error) }

  // The photos were uploaded by the browser while posting; the database checks each one is the poster's own file.
  let photosFailed = false
  if (d.photos.length) {
    const { error: photoError } = await supabase.rpc("set_job_photos", { p_job_id: data, p_paths: d.photos })
    photosFailed = !!photoError
  }
  revalidatePath("/", "layout")
  return { ok: true, data: { id: data, photosFailed } }
}
