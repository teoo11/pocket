import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { signedIn, USERS } from "./helpers"

test.describe("app shell", () => {
  test("public pages render in English by default", async ({ page }) => {
    await page.goto("/minors")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rules for minors (under 18)")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
  })

  test("Romanian browsers get Romanian", async ({ browser }) => {
    const context = await browser.newContext({ locale: "ro-RO" })
    const page = await context.newPage()
    await page.goto("/help")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cum folosești Pocket")
    await context.close()
  })

  test("Aa scales the whole page and is remembered", async ({ page }) => {
    await page.goto("/help")
    const size = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))
    expect(await size()).toBe(16)
    await page.getByRole("button", { name: "Text size" }).click()
    await page.getByRole("radio", { name: "Largest" }).click()
    expect(await size()).toBeCloseTo(20.8)
    await page.reload()
    expect(await size()).toBeCloseTo(20.8)
  })

  test("dark mode is applied from the menu", async ({ page }) => {
    await page.goto("/help")
    await page.getByRole("button", { name: "Settings" }).click()
    await page.getByRole("menuitemradio", { name: "Dark" }).click()
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  })

  test("signed in: the Post button is big, and Home has jobs", async ({ page }) => {
    await signedIn(page, USERS.other)
    const box = await page.getByRole("link", { name: "Post a job" }).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(54)
    await expect(page.getByRole("heading", { name: /close to you/ })).toBeVisible()
  })

  for (const path of ["/login", "/signup", "/minors", "/help", "/legal/notices", "/privacy", "/terms"]) {
    test(`no accessibility violations on ${path}`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }

  test("no accessibility violations on Home (signed in)", async ({ page }) => {
    await signedIn(page, USERS.other)
    // Wait for the page itself, not the loading placeholder.
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`)).toEqual([])
  })

  // Every signed-in screen opens, shows its heading, and passes axe.
  const PAGES: [string, RegExp][] = [
    ["/my-jobs", /part of/],
    ["/top", /Top helpers/],
    ["/me", /E2E/],
    ["/me/earnings", /earnings/i],
    ["/notifications", /Notifications/],
    ["/messages", /Messages/],
    ["/search", /Search jobs/],
    ["/contact", /Contact the Pocket team/],
    ["/post", /What do you need help with/],
    ["/map", /Jobs on the map/],
  ]
  test("every signed-in page opens with no accessibility violations", async ({ page }) => {
    test.setTimeout(180_000)
    await signedIn(page, USERS.other)
    for (const [path, heading] of PAGES) {
      await page.goto(path)
      await expect(page.getByRole("heading", { level: 1 }).first(), path).toHaveText(heading, { timeout: 20_000 })
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map((v) => `${path} ${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`)).toEqual([])
    }
  })
})
