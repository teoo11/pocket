"use server"

import { z } from "zod"

import { type ActionResult, rpcErrorKey } from "@/lib/rpc-errors"
import { createClient } from "@/lib/supabase/server"

import { CONTACT_TOPICS, REPORT_REASONS, type ReportKind } from "./reasons"

const reportSchema = z
  .object({
    kind: z.enum(["job", "user", "message", "app"]),
    targetId: z.string().optional(),
    reason: z.string(),
    details: z.string().trim().max(1000),
  })
  .refine((r) => (REPORT_REASONS[r.kind as ReportKind] as readonly string[]).includes(r.reason))
  .refine((r) => r.kind === "app" || !!r.targetId)

/** Reports land in public.reports; the team reads them in the Supabase dashboard. */
export async function createReport(input: z.input<typeof reportSchema>): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const { kind, targetId, reason, details } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from("reports").insert({
    kind,
    reason,
    details,
    job_id: kind === "job" ? targetId : null,
    user_id: kind === "user" ? targetId : null,
    message_id: kind === "message" ? Number(targetId) : null,
  })
  if (error) return { ok: false, error: rpcErrorKey(error) }
  return { ok: true }
}

const messageSchema = z.object({ topic: z.enum(CONTACT_TOPICS), body: z.string().trim().min(1).max(2000) })

export async function sendTeamMessage(input: z.input<typeof messageSchema>): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const supabase = await createClient()
  const { error } = await supabase.from("team_messages").insert(parsed.data)
  if (error) return { ok: false, error: rpcErrorKey(error) }
  return { ok: true }
}
