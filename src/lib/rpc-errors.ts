/**
 * The database raises stable keys (errcode P0001) from the lifecycle functions; see
 * supabase/migrations/*_lifecycle.sql. They map to messages under `errors.<key>`.
 */
export const RPC_ERROR_KEYS = [
  "not_signed_in",
  "not_onboarded",
  "not_allowed",
  "not_found",
  "invalid_state",
  "invalid_input",
  "invalid_name",
  "invalid_phone",
  "outside_area",
  "in_the_past",
  "too_far_ahead",
  "blocked_words",
  "category_label_required",
  "rate_limited",
  "own_job",
  "example_job",
  "already_offered",
  "already_paid",
  "payment_pending",
  "already_reviewed",
  "chat_closed",
  "card_not_accepted",
  "card_unavailable",
  "active_jobs",
] as const
export type RpcErrorKey = (typeof RPC_ERROR_KEYS)[number] | "unknown"

/** Turns a PostgREST / Postgres error into one of the known keys ("unknown" otherwise). */
export function rpcErrorKey(error: { message?: string; code?: string } | null | undefined): RpcErrorKey {
  if (!error) return "unknown"
  const message = (error.message ?? "").trim()
  if ((RPC_ERROR_KEYS as readonly string[]).includes(message)) return message as RpcErrorKey
  if (error.code === "42501") return "not_allowed"
  return "unknown"
}

/** What server actions return to forms and buttons. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: RpcErrorKey | "invalid_input" | "auth_failed" | "email_taken" | "weak_password" | "rate_limited" }
