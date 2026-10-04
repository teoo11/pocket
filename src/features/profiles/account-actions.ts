"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { type ActionResult, rpcErrorKey } from "@/lib/rpc-errors"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const confirmSchema = z.object({ confirm: z.literal(true) })

/**
 * Deletes the signed-in person's account (GDPR). The database first refuses while a job is under way, and
 * cancels their open jobs and offers; then the photo and the login are removed. Other people keep their
 * history of shared jobs, payments and reviews, without the link to this person.
 */
export async function deleteMyAccount(input: z.input<typeof confirmSchema>): Promise<ActionResult> {
  if (!confirmSchema.safeParse(input).success) return { ok: false, error: "invalid_input" }
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims.sub
  if (!uid) return { ok: false, error: "not_signed_in" }

  const { error } = await supabase.rpc("prepare_account_deletion")
  if (error) return { ok: false, error: rpcErrorKey(error) }

  const admin = createAdminClient()
  const { data: files } = await admin.storage.from("avatars").list(uid)
  if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${uid}/${f.name}`))
  const { error: deleteError } = await admin.auth.admin.deleteUser(uid)
  if (deleteError) {
    console.error("[account] delete failed", deleteError)
    return { ok: false, error: "unknown" }
  }
  await supabase.auth.signOut()
  redirect("/login?deleted=1")
}
