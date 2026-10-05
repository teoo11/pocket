import { expect, type Page, test } from "@playwright/test"

import { signedIn, USERS } from "./helpers"

// The job search on Home and the Profile page. Runs without a Maps key (see playwright.config.ts), so the
// map view shows its fallback. The example jobs from the seed are the data.
test.describe.configure({ mode: "serial" })
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "one run is enough"))

/** Distances on the result cards, in metres, in the order shown ("300 m", "1,2 km"). */
async function cardDistances(page: Page): Promise<number[]> {
  const texts = await page.locator('main a[href^="/jobs/"]').allInnerTexts()
  return texts.flatMap((text) => {
    const m = /(\d+(?:[.,]\d+)?)\s(km|m)\b/.exec(text)
    return m ? [Number(m[1].replace(",", ".")) * (m[2] === "km" ? 1000 : 1)] : []
  })
}

const countLine = (page: Page) => page.getByText(/^(\d+|No) jobs? found$/)

test("Home shows the search under Top helpers, nearest first by default", async ({ page }) => {
  await signedIn(page, USERS.other)
  const search = page.getByRole("search")
  await expect(search).toBeVisible()
  // Top helpers come before the search.
  const top = await page.getByRole("link", { name: /Top helpers this month/ }).boundingBox()
  const bar = await search.boundingBox()
  if (top) expect(top.y).toBeLessThan(bar!.y)

  const distances = await cardDistances(page)
  expect(distances.length).toBeGreaterThan(1)
  expect(distances).toEqual([...distances].sort((a, b) => a - b))

  await page.getByRole("button", { name: "Filters" }).click()
  await expect(page.getByRole("radio", { name: "Nearest" })).toHaveAttribute("aria-checked", "true")
  await expect(page.getByRole("switch", { name: /Show example jobs/ })).toBeChecked()
})

test("each category shows how many jobs it has, and that's what you get", async ({ page }) => {
  await signedIn(page, USERS.other)
  const chips = page.getByRole("tablist", { name: "Kind of job" }).getByRole("tab")
  const all = Number((await chips.first().innerText()).match(/\d+/)![0])
  await expect(countLine(page)).toHaveText(`${all} jobs found`)

  // A category with jobs: its number is the number of cards after choosing it.
  const texts = await chips.allInnerTexts()
  const index = texts.findIndex((t, i) => i > 0 && Number(t.match(/\d+/)?.[0] ?? 0) > 0)
  const n = Number(texts[index].match(/\d+/)![0])
  await chips.nth(index).click()
  await expect(chips.nth(index)).toHaveAttribute("aria-selected", "true")
  await expect(page).toHaveURL(/\?cat=/)
  await expect(page.locator('main a[href^="/jobs/"]')).toHaveCount(n)
})

test("the example jobs can be hidden", async ({ page }) => {
  await signedIn(page, USERS.other)
  await expect(page.getByText("example", { exact: true }).first()).toBeVisible()
  await page.getByRole("button", { name: "Filters" }).click()
  await page.getByRole("switch", { name: /Show example jobs/ }).click()
  await page.getByRole("button", { name: /^Show jobs$/ }).click()
  await expect(page).toHaveURL(/examples=0/)
  await expect(page.getByRole("button", { name: /Remove filter: No example jobs/ })).toBeVisible()
  await expect(page.getByText("example", { exact: true })).toHaveCount(0)
  // Removing the chip brings them back.
  await page.getByRole("button", { name: /Remove filter: No example jobs/ }).click()
  await expect(page).not.toHaveURL(/examples=0/)
})

test("List and Map show the same search; old links still work", async ({ page }) => {
  await signedIn(page, USERS.other)
  await page.getByRole("tab", { name: "Map" }).click()
  await expect(page).toHaveURL(/view=map/)
  await expect(page.getByText("The map can’t be shown right now")).toBeVisible()
  await page.getByRole("tab", { name: "List" }).click()
  await expect(page).not.toHaveURL(/view=map/)

  await page.goto("/search?cat=pet&sort=pay")
  await expect(page).toHaveURL(/\/\?cat=pet&sort=pay$/)
  await page.goto("/map")
  await expect(page).toHaveURL(/\/\?view=map$/)
})

test("Profile: public and private are clearly apart; your own public link opens it", async ({ page }) => {
  await signedIn(page, USERS.other)
  await page.getByRole("link", { name: "Profile" }).first().click()
  await expect(page).toHaveURL(/\/me$/)
  const pub = page.getByRole("region", { name: "Your public profile" })
  const priv = page.getByRole("region", { name: "Private" })
  await expect(pub.getByRole("heading", { level: 1 })).toHaveText(/E2E/)
  await expect(priv.getByText("My earnings")).toBeVisible()
  await expect(priv.getByRole("button", { name: /Phone number/ })).toBeVisible()
  await expect(priv.getByRole("button", { name: /Where I live/ })).toBeVisible()
  // Nothing private in the public part.
  await expect(pub.getByText(/earnings|Phone number|Where I live/)).toHaveCount(0)

  const { account } = await (await page.request.get("/me/export")).json()
  await page.goto(`/profile/${account.id}`)
  await expect(page).toHaveURL(/\/me$/)
})
