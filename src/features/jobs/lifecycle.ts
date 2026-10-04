import type { Enums } from "@/lib/supabase/database.types"

/**
 * What a job means to the person looking at it, at each step of the lifecycle (SPEC §7).
 * The database enforces the rules; this decides what to show and which button comes next.
 */
export type JobStatus = Enums<"job_status">
export type OfferStatus = Enums<"offer_status">

export type LifecycleJob = {
  status: JobStatus
  poster_id: string | null
  helper_id: string | null
  half1_paid_at: string | null
}

export type ViewerContext = {
  viewerId: string
  /** The viewer's latest offer on this job, if any. */
  myOffer?: OfferStatus | null
  /** Pending offers (only known to the poster). */
  pendingOffers?: number
  /** The viewer has already reviewed this job. */
  reviewed?: boolean
}

export type Role = "poster" | "helper" | "offerer" | "stranger"

export function roleOf(job: LifecycleJob, ctx: ViewerContext): Role {
  if (job.poster_id === ctx.viewerId) return "poster"
  if (job.helper_id === ctx.viewerId) return "helper"
  if (ctx.myOffer) return "offerer"
  return "stranger"
}

/** The next thing the viewer can do. Null when it's someone else's turn or nothing is left. */
export type NextStep =
  | "offer" // stranger, open job
  | "withdraw" // pending offer
  | "pick" // poster, open job with offers
  | "start" // helper, accepted
  | "payFirst" // poster, started and first half not paid
  | "finish" // helper, started
  | "confirm" // poster, done
  | "payRest" // poster, completed
  | "review" // poster or helper, paid and not reviewed yet
  | "cancel" // poster, open or accepted (before the start)

export function nextSteps(job: LifecycleJob, ctx: ViewerContext): NextStep[] {
  const role = roleOf(job, ctx)
  const s = job.status
  if (role === "poster") {
    const steps: NextStep[] = []
    if (s === "open" && (ctx.pendingOffers ?? 0) > 0) steps.push("pick")
    if ((s === "started" || s === "done") && !job.half1_paid_at) steps.push("payFirst")
    if (s === "done") steps.push("confirm")
    if (s === "completed") steps.push("payRest")
    if (s === "paid" && !ctx.reviewed) steps.push("review")
    if (s === "open" || s === "accepted") steps.push("cancel")
    return steps
  }
  if (role === "helper") {
    if (s === "accepted") return ["start"]
    if (s === "started") return ["finish"]
    if (s === "paid" && !ctx.reviewed) return ["review"]
    return []
  }
  if (s !== "open") return []
  if (role === "offerer" && ctx.myOffer === "pending") return ["withdraw"]
  return ["offer"]
}

/** Steps that make the job show "Needs you" and count on the My jobs badge (not cancelling or offering). */
export function needsAction(job: LifecycleJob, ctx: ViewerContext): boolean {
  return nextSteps(job, ctx).some((s) => s !== "cancel" && s !== "offer" && s !== "withdraw")
}

/** The status line on cards and rows: a message key under `jobStatus`, and whether to highlight it. */
export type StatusLine = { key: string; highlight: boolean; count?: number } | null

export function statusLine(job: LifecycleJob, ctx: ViewerContext): StatusLine {
  const role = roleOf(job, ctx)
  const s = job.status
  if (s === "cancelled") return role === "stranger" ? null : { key: "cancelled", highlight: false }
  if (role === "poster") {
    switch (s) {
      case "open": {
        const n = ctx.pendingOffers ?? 0
        return n ? { key: "offers", highlight: true, count: n } : { key: "waitingOffers", highlight: false }
      }
      case "accepted":
        return { key: "helperPicked", highlight: false }
      case "started":
        return job.half1_paid_at ? { key: "inProgress", highlight: false } : { key: "payFirst", highlight: true }
      case "done":
        return { key: "confirmDone", highlight: true }
      case "completed":
        return { key: "payRest", highlight: true }
      case "paid":
        return ctx.reviewed ? { key: "finished", highlight: false } : { key: "rateHelper", highlight: true }
    }
  }
  if (role === "helper") {
    switch (s) {
      case "accepted":
        return { key: "youreHelping", highlight: true }
      case "started":
        return { key: "inProgress", highlight: true }
      case "done":
        return { key: "waitingConfirm", highlight: false }
      case "completed":
        return { key: "waitingRest", highlight: false }
      case "paid":
        return ctx.reviewed ? { key: "finished", highlight: false } : { key: "ratePoster", highlight: true }
    }
  }
  if (role === "offerer") {
    if (ctx.myOffer === "pending") return { key: "youOffered", highlight: false }
    if (ctx.myOffer === "declined" && s !== "open") return { key: "someoneElse", highlight: false }
  }
  return null
}

/** After the pick, poster and helper see each other's contact details and the address. */
export function isMatched(status: JobStatus): boolean {
  return status === "accepted" || status === "started" || status === "done" || status === "completed" || status === "paid"
}

export function isFinished(status: JobStatus): boolean {
  return status === "completed" || status === "paid"
}
