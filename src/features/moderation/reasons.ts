/** Report reasons (keys; labels in messages `report.reasons`). From the prototype's REPORT_OPTS. */
export const REPORT_REASONS = {
  job: ["not_as_described", "felt_unsafe", "rude", "payment", "no_show", "minor_not_allowed", "other"],
  user: ["rude_or_unsafe", "no_show", "didnt_pay", "fake_profile", "other"],
  message: ["rude_or_unsafe", "spam", "asks_off_app_payment", "other"],
  app: ["broken", "job_wrong", "bothering_me", "other"],
} as const

export type ReportKind = keyof typeof REPORT_REASONS

/** Topics for "Send us a message" on the contact page. */
export const CONTACT_TOPICS = ["question", "job_problem", "safety", "payment", "idea", "other"] as const
