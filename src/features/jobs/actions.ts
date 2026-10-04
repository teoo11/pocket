"use server"

import type { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { type ActionResult, rpcErrorKey } from "@/lib/rpc-errors"
import { createClient } from "@/lib/supabase/server"

/**
 * The job lifecycle as server actions. Each validates its input and calls the matching database
 * function, which checks who is asking and the job's state (supabase/migrations/*_lifecycle.sql).
 */
const uuid = z.uuid()
const INVALID = { ok: false, error: "invalid_input" } as const

function result(error: PostgrestError | null, jobId: string): ActionResult {
  if (error) return { ok: false, error: rpcErrorKey(error) }
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function makeOffer(jobId: string): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success) return INVALID
  const { error } = await (await createClient()).rpc("make_offer", { p_job_id: jobId })
  return result(error, jobId)
}

export async function withdrawOffer(jobId: string): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success) return INVALID
  const { error } = await (await createClient()).rpc("withdraw_offer", { p_job_id: jobId })
  return result(error, jobId)
}

export async function pickHelper(jobId: string, offerId: string): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success || !uuid.safeParse(offerId).success) return INVALID
  const { error } = await (await createClient()).rpc("pick_helper", { p_offer_id: offerId })
  return result(error, jobId)
}

export async function cancelJob(jobId: string): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success) return INVALID
  const { error } = await (await createClient()).rpc("cancel_job", { p_job_id: jobId })
  return result(error, jobId)
}

export async function startJob(jobId: string): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success) return INVALID
  const { error } = await (await createClient()).rpc("start_job", { p_job_id: jobId })
  return result(error, jobId)
}

export async function finishJob(jobId: string, minutes: number): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success || !z.number().int().min(1).max(600).safeParse(minutes).success) return INVALID
  const { error } = await (await createClient()).rpc("finish_job", { p_job_id: jobId, p_minutes: minutes })
  return result(error, jobId)
}

export async function confirmJob(jobId: string): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success) return INVALID
  const { error } = await (await createClient()).rpc("confirm_job", { p_job_id: jobId })
  return result(error, jobId)
}

export async function payCash(jobId: string, part: 1 | 2): Promise<ActionResult> {
  if (!uuid.safeParse(jobId).success || (part !== 1 && part !== 2)) return INVALID
  const { error } = await (await createClient()).rpc("record_cash_payment", { p_job_id: jobId, p_part: part })
  return result(error, jobId)
}

const reviewSchema = z.object({
  jobId: uuid,
  stars: z.number().int().min(1).max(5),
  tags: z.array(z.string().regex(/^[a-z_]{2,30}$/)).max(4),
  comment: z.string().trim().max(500),
})

export async function submitReview(input: z.input<typeof reviewSchema>): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return INVALID
  const { jobId, stars, tags, comment } = parsed.data
  const { error } = await (await createClient()).rpc("submit_review", {
    p_job_id: jobId,
    p_stars: stars,
    p_tags: tags,
    p_comment: comment,
  })
  return result(error, jobId)
}
