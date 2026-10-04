"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export async function markAllRead() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims.sub) return
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", data.claims.sub).is("read_at", null)
  revalidatePath("/", "layout")
}

export async function markRead(id: number) {
  if (!z.number().int().positive().safeParse(id).success) return
  const supabase = await createClient()
  // RLS limits this to my own notifications.
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null)
  revalidatePath("/", "layout")
}
