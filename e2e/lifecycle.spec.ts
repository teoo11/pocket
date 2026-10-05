import { expect, type Page, test } from "@playwright/test"

import { signedIn, USERS } from "./helpers"

// The whole job story from SPEC §7, with two people in two browsers (the prototype's demo story).
test.describe.configure({ mode: "serial" })
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "one full run is enough"))

const DEMO = "I’m going away tomorrow and need someone to walk my dog at around 5 for half an hour."

/** With SCREENS=<folder>, saves screenshots along the way for a visual check. */
async function shot(page: Page, name: string) {
  if (process.env.SCREENS) await page.screenshot({ path: `${process.env.SCREENS}/${name}.png`, fullPage: true })
}

async function next(page: Page) {
  await page.getByRole("button", { name: "Next", exact: true }).click()
}

test("post → offer → pick → start → pay half → finish → confirm → pay rest → reviews", async ({ browser }) => {
  test.setTimeout(180_000)
  const posterCtx = await browser.newContext()
  const helperCtx = await browser.newContext()
  const poster = await posterCtx.newPage()
  const helper = await helperCtx.newPage()

  // Poster adds a phone number during onboarding, so the helper sees it after the pick.
  await signedIn(poster, USERS.poster)
  await signedIn(helper, USERS.helper, "Dorobanți")

  // ── Post the demo job through the 8 steps ──
  await poster.getByRole("link", { name: "Post a job" }).click()
  // The wizard loads in the browser only; the dev server may still be compiling it.
  await expect(poster.getByRole("heading", { name: "What do you need help with?" })).toBeVisible({ timeout: 20_000 })
  await poster.getByRole("radio", { name: "Pets" }).click()
  await next(poster)
  await poster.getByLabel("Write it the way you would tell a friend.").fill(DEMO)
  await next(poster)
  await expect(poster.getByText(/You chose: .*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)).toBeVisible()
  await next(poster) // day: tomorrow, read from the text
  await expect(poster.getByText(/You chose: 17:00 – 17:30/)).toBeVisible()
  await next(poster) // time
  await next(poster) // length: 30 min
  await next(poster) // pay: suggested 25 lei
  await poster.getByLabel("Street and number").fill("Str. Glinka 8, ap. 3")
  await poster.waitForTimeout(process.env.SCREENS ? 2500 : 0) // let the map tiles load
  await shot(poster, "post-address")
  await next(poster)
  await expect(poster.getByLabel("Title")).toHaveValue("Walk my dog")
  await poster.getByRole("button", { name: "Post my job" }).click()
  await poster.waitForURL(/\/jobs\/[0-9a-f-]{36}$/)
  const jobUrl = poster.url()
  await expect(poster.getByRole("heading", { name: "Walk my dog" })).toBeVisible()
  await expect(poster.getByText("No offers yet")).toBeVisible()

  // ── Helper finds it on the map, then offers ──
  if (process.env.SCREENS) {
    await helper.goto("/?view=map")
    await helper.waitForTimeout(3000)
    await shot(helper, "map")
  }
  await helper.goto(jobUrl)
  if (process.env.SCREENS) {
    await helper.waitForTimeout(2500)
    await shot(helper, "job-area-map")
  }
  await expect(helper.getByText("Under 18?")).toBeVisible()
  await helper.getByRole("button", { name: "Offer to help" }).click()
  await expect(helper.getByText("You offered to help").first()).toBeVisible()

  // ── Poster sees the offer live (realtime) and picks ──
  await expect(poster.getByText("1 person offered to help")).toBeVisible({ timeout: 15_000 })

  // ── Live chat, open from the offer onward ──
  await helper.getByRole("link", { name: /^Message / }).click()
  await helper.waitForURL(/\/messages\/[0-9a-f-]{36}$/)
  const chatUrl = helper.url()
  await helper.getByLabel("Write a message").fill("Hi! Is the dog friendly with strangers?")
  await helper.keyboard.press("Enter")
  await expect(helper.getByText("Hi! Is the dog friendly with strangers?")).toBeVisible()
  // The poster gets a live toast on the job page, opens the conversation and replies; the helper sees it live.
  await expect(poster.getByText(/New message from/)).toBeVisible({ timeout: 15_000 })
  await poster.goto(chatUrl)
  await expect(poster.getByText("Hi! Is the dog friendly with strangers?")).toBeVisible()
  await poster.getByLabel("Write a message").fill("Very friendly. See you tomorrow!")
  await poster.getByRole("button", { name: "Send" }).click()
  await expect(helper.getByText("Very friendly. See you tomorrow!")).toBeVisible({ timeout: 15_000 })
  await shot(helper, "chat-thread")
  await helper.goto("/messages")
  await shot(helper, "chat-inbox")
  await poster.goto(jobUrl)
  await helper.goto(jobUrl)

  await poster.getByRole("button", { name: "Pick" }).click()
  await expect(poster.getByText(/is helping you/)).toBeVisible()

  // ── Helper: picked, sees the address; starts ──
  await expect(helper.getByText(/picked you/)).toBeVisible({ timeout: 15_000 })
  await expect(helper.getByText("Str. Glinka 8, ap. 3")).toBeVisible()
  await helper.getByRole("button", { name: "I’m starting now" }).click()
  await expect(helper.getByRole("button", { name: "Completed" })).toBeVisible()

  // ── Poster pays the first half (ceil(25 / 2) = 13 lei) ──
  // The live notification toast says the same thing, so look for the heading.
  await expect(poster.getByRole("heading", { name: "Pay the first half: 13 lei" })).toBeVisible({ timeout: 15_000 })
  await poster.getByRole("button", { name: "I’ve paid 13 lei in cash" }).click()
  await expect(poster.getByRole("heading", { name: /Pay the first half/ })).toBeHidden()

  // ── Helper: a "New earnings" pop-up arrives live; then finishes: 30 min = 3 points ──
  await expect(helper.getByRole("dialog")).toContainText("+13 lei", { timeout: 15_000 })
  await shot(helper, "new-earnings")
  await helper.getByRole("button", { name: "Nice" }).click()
  await expect(helper.getByRole("dialog")).toBeHidden()
  await helper.getByRole("button", { name: "Completed" }).click()
  await expect(helper.getByRole("dialog")).toContainText("3 points")
  await helper.getByRole("button", { name: /The planned 30 min/ }).click()
  await expect(helper.getByText(/Waiting for/)).toBeVisible()

  // ── Poster confirms and pays the rest (12 lei) ──
  await expect(poster.getByRole("button", { name: "Yes, it’s done" })).toBeVisible({ timeout: 15_000 })
  await poster.getByRole("button", { name: "Yes, it’s done" }).click()
  await poster.getByRole("button", { name: "I’ve paid 12 lei in cash" }).click()

  // ── Both review (double-blind) ──
  await poster.getByRole("radio", { name: "5 stars" }).click()
  await expect(poster.getByText("Excellent!")).toBeVisible()
  await poster.getByRole("button", { name: "On time" }).click()
  await poster.getByRole("button", { name: "Send" }).click()
  await expect(poster.getByText("All done")).toBeVisible()
  // Double-blind: the poster's review is saved, the helper's isn't written yet.
  await expect(poster.getByText("Your review")).toBeVisible()
  await expect(poster.getByText(/You’ll see .*’s review here/)).toBeVisible()

  // The helper is still on the job page: the second payment arrives live.
  await expect(helper.getByRole("dialog")).toContainText("+12 lei", { timeout: 15_000 })
  await helper.getByRole("button", { name: "Nice" }).click()
  // The helper can't see the poster's review before leaving their own.
  await expect(helper.getByText(/’s review of you/)).toBeHidden()
  await helper.getByRole("radio", { name: "4 stars" }).click()
  await helper.getByRole("button", { name: "Paid on time" }).click()
  await helper.getByRole("button", { name: "Send" }).click()
  await expect(helper.getByText("All done")).toBeVisible()
  await expect(helper.getByText("You earned 3 points on Top helpers")).toBeVisible()
  // Both written, so both are revealed, on each side.
  await expect(helper.getByText(/’s review of you/)).toBeVisible()
  // React reveals streamed content on an animation frame, which browsers pause in background tabs.
  await poster.bringToFront()
  await poster.reload()
  // The page frame shows at once and the job streams in after it.
  await expect(poster.getByText(/’s review of you/)).toBeVisible({ timeout: 15_000 })
  await shot(poster, "job-reviews")
  // The poster's profile, as the helper sees it: rating as a poster, "Known for", the review.
  await helper.locator('main a[href^="/profile/"]').first().click()
  await helper.waitForURL(/\/profile\//)
  await shot(helper, "profile")

  await posterCtx.close()
  await helperCtx.close()
})
