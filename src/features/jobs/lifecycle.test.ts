import { describe, expect, it } from "vitest"

import { type LifecycleJob, needsAction, nextSteps, roleOf, statusLine } from "./lifecycle"

const P = "poster"
const H = "helper"
const X = "someone"
const job = (status: LifecycleJob["status"], extra: Partial<LifecycleJob> = {}): LifecycleJob => ({
  status,
  poster_id: P,
  helper_id: status === "open" || status === "cancelled" ? null : H,
  half1_paid_at: null,
  ...extra,
})

describe("roles", () => {
  it("poster, helper, offerer, stranger", () => {
    expect(roleOf(job("accepted"), { viewerId: P })).toBe("poster")
    expect(roleOf(job("accepted"), { viewerId: H })).toBe("helper")
    expect(roleOf(job("open"), { viewerId: X, myOffer: "pending" })).toBe("offerer")
    expect(roleOf(job("open"), { viewerId: X })).toBe("stranger")
  })
})

describe("next steps through the whole lifecycle", () => {
  it("open", () => {
    expect(nextSteps(job("open"), { viewerId: X })).toEqual(["offer"])
    expect(nextSteps(job("open"), { viewerId: X, myOffer: "pending" })).toEqual(["withdraw"])
    expect(nextSteps(job("open"), { viewerId: X, myOffer: "withdrawn" })).toEqual(["offer"])
    expect(nextSteps(job("open"), { viewerId: P, pendingOffers: 0 })).toEqual(["cancel"])
    expect(nextSteps(job("open"), { viewerId: P, pendingOffers: 2 })).toEqual(["pick", "cancel"])
  })
  it("accepted: the helper starts; the poster can still cancel", () => {
    expect(nextSteps(job("accepted"), { viewerId: H })).toEqual(["start"])
    expect(nextSteps(job("accepted"), { viewerId: P })).toEqual(["cancel"])
    expect(nextSteps(job("accepted"), { viewerId: X, myOffer: "declined" })).toEqual([])
  })
  it("started: the poster pays the first half, the helper finishes", () => {
    expect(nextSteps(job("started"), { viewerId: P })).toEqual(["payFirst"])
    expect(nextSteps(job("started", { half1_paid_at: "x" }), { viewerId: P })).toEqual([])
    expect(nextSteps(job("started"), { viewerId: H })).toEqual(["finish"])
  })
  it("done: confirm (and the first half if it was skipped)", () => {
    expect(nextSteps(job("done"), { viewerId: P })).toEqual(["payFirst", "confirm"])
    expect(nextSteps(job("done", { half1_paid_at: "x" }), { viewerId: P })).toEqual(["confirm"])
    expect(nextSteps(job("done"), { viewerId: H })).toEqual([])
  })
  it("completed, paid, reviewed", () => {
    expect(nextSteps(job("completed"), { viewerId: P })).toEqual(["payRest"])
    expect(nextSteps(job("paid"), { viewerId: P })).toEqual(["review"])
    expect(nextSteps(job("paid"), { viewerId: H })).toEqual(["review"])
    expect(nextSteps(job("paid"), { viewerId: H, reviewed: true })).toEqual([])
  })
})

describe("needs you", () => {
  it("counts only real actions", () => {
    expect(needsAction(job("open"), { viewerId: P, pendingOffers: 0 })).toBe(false)
    expect(needsAction(job("open"), { viewerId: P, pendingOffers: 1 })).toBe(true)
    expect(needsAction(job("open"), { viewerId: X })).toBe(false)
    expect(needsAction(job("accepted"), { viewerId: H })).toBe(true)
    expect(needsAction(job("done"), { viewerId: H })).toBe(false)
  })
})

describe("status lines", () => {
  it("poster", () => {
    expect(statusLine(job("open"), { viewerId: P, pendingOffers: 2 })).toEqual({ key: "offers", highlight: true, count: 2 })
    expect(statusLine(job("started"), { viewerId: P })).toEqual({ key: "payFirst", highlight: true })
    expect(statusLine(job("paid"), { viewerId: P, reviewed: true })).toEqual({ key: "finished", highlight: false })
  })
  it("helper and others", () => {
    expect(statusLine(job("accepted"), { viewerId: H })?.key).toBe("youreHelping")
    expect(statusLine(job("open"), { viewerId: X, myOffer: "pending" })?.key).toBe("youOffered")
    expect(statusLine(job("accepted"), { viewerId: X, myOffer: "declined" })?.key).toBe("someoneElse")
    expect(statusLine(job("open"), { viewerId: X })).toBeNull()
  })
})
