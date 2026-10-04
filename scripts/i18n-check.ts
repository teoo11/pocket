/**
 * Checks that every language file has exactly the same message keys as English.
 * Run with `npm run i18n:check` (also part of `npm test` through i18n.test.ts).
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

type Messages = { [key: string]: string | Messages }

export function flattenKeys(obj: Messages, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [prefix + k] : flattenKeys(v, `${prefix}${k}.`),
  )
}

export function compareLocales(base: Messages, other: Messages) {
  const a = new Set(flattenKeys(base))
  const b = new Set(flattenKeys(other))
  return {
    missing: [...a].filter((k) => !b.has(k)),
    extra: [...b].filter((k) => !a.has(k)),
  }
}

function load(locale: string): Messages {
  return JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8"))
}

if (process.argv[1]?.endsWith("i18n-check.ts")) {
  const { missing, extra } = compareLocales(load("en"), load("ro"))
  if (missing.length || extra.length) {
    if (missing.length) console.error("Missing in ro.json:\n  " + missing.join("\n  "))
    if (extra.length) console.error("Only in ro.json:\n  " + extra.join("\n  "))
    process.exit(1)
  }
  console.log("en.json and ro.json have the same keys.")
}
