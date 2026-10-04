import { describe, expect, it } from "vitest"

import { compareLocales } from "../../scripts/i18n-check"
import en from "../../messages/en.json"
import ro from "../../messages/ro.json"
import { localeFromAcceptLanguage } from "./config"

describe("messages", () => {
  it("ro.json has exactly the same keys as en.json", () => {
    expect(compareLocales(en, ro)).toEqual({ missing: [], extra: [] })
  })

  it('never says "money" (the team asked for "earnings")', () => {
    expect(JSON.stringify(en)).not.toMatch(/\bmoney\b/i)
    expect(JSON.stringify(ro)).not.toMatch(/\bbani\b/i)
  })
})

describe("localeFromAcceptLanguage", () => {
  it("uses the browser language when supported", () => {
    expect(localeFromAcceptLanguage("ro-RO,ro;q=0.9,en;q=0.8")).toBe("ro")
    expect(localeFromAcceptLanguage("en-GB,en;q=0.9")).toBe("en")
  })

  it("respects q-values", () => {
    expect(localeFromAcceptLanguage("en;q=0.5,ro;q=0.9")).toBe("ro")
  })

  it("falls back to English for anything else", () => {
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9")).toBe("en")
    expect(localeFromAcceptLanguage("de-DE,ro;q=0.3")).toBe("ro")
    expect(localeFromAcceptLanguage(null)).toBe("en")
    expect(localeFromAcceptLanguage("")).toBe("en")
  })
})
