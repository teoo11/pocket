import { existsSync, readFileSync } from "node:fs"

import { expect, type Page } from "@playwright/test"

for (const file of [".env.test.local"]) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

/** Created by `npx tsx scripts/e2e-users.ts` (run it before the suite: npm run e2e does). */
export const USERS = {
  poster: "pocket-e2e-poster@example.com",
  helper: "pocket-e2e-helper@example.com",
  other: "pocket-e2e-other@example.com",
  newcomer: "pocket-e2e-newcomer@example.com",
} as const

export function password() {
  const pw = process.env.E2E_PASSWORD
  if (!pw) throw new Error("E2E_PASSWORD missing: run `npx tsx scripts/e2e-users.ts` first")
  return pw
}

export async function logIn(page: Page, email: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password())
  await page.getByRole("button", { name: "Log in" }).click()
}

/** Log in, and finish onboarding if this account hasn't yet. Ends on Home. */
export async function signedIn(page: Page, email: string, place = "Floreasca") {
  await logIn(page, email)
  // After log-in the URL is briefly "/" before the server sends new accounts on to /onboarding,
  // so wait for what is actually on screen. The dev server may still be compiling the first page.
  const onboarding = page.getByRole("heading", { name: "Last step" })
  await expect(onboarding.or(page.getByRole("navigation", { name: "Main" }).first())).toBeVisible({ timeout: 30_000 })
  if (await onboarding.isVisible()) {
    await page.getByRole("textbox", { name: "Where do you live?" }).fill(place)
    await page.getByRole("radio", { name: new RegExp(`^${place}`) }).first().click()
    await page.getByRole("button", { name: "Start using Pocket" }).click()
    await page.waitForURL("/")
  }
  await expect(page.getByRole("navigation", { name: "Main" }).first()).toBeVisible()
}
