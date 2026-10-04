"use server"

import { z } from "zod"

import { type ActionResult, rpcErrorKey } from "@/lib/rpc-errors"
import { createClient } from "@/lib/supabase/server"

import type { ChatMessage } from "./queries"

const sendSchema = z.object({ conversationId: z.uuid(), body: z.string().trim().min(1).max(2000) })

/** Sends a message. RLS lets people write only in their own open conversations; a trigger limits floods. */
export async function sendMessage(
  input: z.input<typeof sendSchema>,
): Promise<ActionResult<ChatMessage>> {
  const parsed = sendSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: parsed.data.conversationId, body: parsed.data.body })
    .select("id, sender_id, body, created_at")
    .single()
  if (error) return { ok: false, error: error.code === "42501" ? "chat_closed" : rpcErrorKey(error) }
  return { ok: true, data }
}

/** Marks the conversation as read up to now. */
export async function markConversationRead(conversationId: string): Promise<void> {
  if (!z.uuid().safeParse(conversationId).success) return
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims.sub
  if (!uid) return
  await supabase
    .from("conversation_reads")
    .upsert({ conversation_id: conversationId, user_id: uid, last_read_at: new Date().toISOString() })
}
