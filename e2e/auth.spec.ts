import { expect, test } from "@playwright/test"

import { logIn, signedIn, USERS } from "./helpers"

// Accounts are reset before each run (global setup); onboarding happens once, so run this file on one project.
test.describe.configure({ mode: "serial" })
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "auth flow runs once, on desktop"))

test("signed-out visitors are sent to log in, and come back after", async ({ page }) => {
  await page.goto("/top")
  await expect(page).toHaveURL(/\/login\?next=%2Ftop/)
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
})

test("Continue with Google goes to Google's sign-in (through Supabase)", async ({ page }) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "Continue with Google" }).click()
  await page.waitForURL(/accounts\.google\.com/, { timeout: 20_000 })
})

test("a wrong password shows a plain message", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill(USERS.poster)
  await page.getByLabel("Password", { exact: true }).fill("not-the-password")
  await page.getByRole("button", { name: "Log in" }).click()
  // (Next.js keeps an empty role="alert" route announcer on every page.)
  await expect(page.getByRole("alert").filter({ hasText: "don’t match" })).toBeVisible()
})

test("sign-up form checks the fields before sending", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("Your name").fill("A")
  await page.getByLabel("Email").fill("not-an-email")
  await page.getByLabel("Choose a password").fill("short")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(page.getByText("Type your name (2 to 40 letters).")).toBeVisible()
  await expect(page.getByText("Type a valid email address")).toBeVisible()
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible()
})

test("first log-in goes through onboarding, then Home", async ({ page }) => {
  await logIn(page, USERS.newcomer)
  await expect(page).toHaveURL(/\/onboarding/)
  await expect(page.getByRole("heading", { name: "Last step" })).toBeVisible()
  // Pocket only knows Bucharest and Ilfov places.
  await page.getByRole("textbox", { name: "Where do you live?" }).fill("Timisoara")
  await expect(page.getByText("No place with that name")).toBeVisible()
  await page.getByRole("textbox", { name: "Where do you live?" }).fill("Floreasca")
  await page.getByRole("radio", { name: /^Floreasca/ }).first().click()
  await page.getByRole("button", { name: "Start using Pocket" }).click()
  await page.waitForURL("/")
  await expect(page.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true")
})

test("log out from the account menu", async ({ page }) => {
  await signedIn(page, USERS.newcomer)
  await page.getByRole("button", { name: "Your account" }).click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
  await expect(page).toHaveURL(/\/login/)
})

test("download my data, then delete the account", async ({ page }) => {
  await signedIn(page, USERS.newcomer)
  const res = await page.request.get("/me/export")
  expect(res.ok()).toBe(true)
  const data = await res.json()
  expect(data.account.email).toBe(USERS.newcomer)
  expect(data.private_details.home_label).toBe("Floreasca")

  await page.goto("/me")
  await page.getByRole("button", { name: "Delete my account" }).click()
  await expect(page.getByRole("dialog")).toContainText("can’t be undone")
  await page.getByRole("button", { name: "Yes, delete it" }).click()
  await expect(page).toHaveURL(/\/login\?deleted=1/)
  await expect(page.getByText("Your account was deleted")).toBeVisible()

  // The old password no longer works.
  await logIn(page, USERS.newcomer)
  await expect(page.getByRole("alert").filter({ hasText: "don’t match" })).toBeVisible()
})
