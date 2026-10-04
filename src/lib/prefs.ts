/** Aa text-size options, as in the prototype: ×1, ×1.15, ×1.3. Stored in a cookie so the first paint is right. */
export const TEXT_SIZES = [
  { value: 1, key: "standard" },
  { value: 1.15, key: "larger" },
  { value: 1.3, key: "largest" },
] as const
export type TextSize = (typeof TEXT_SIZES)[number]["value"]

export const TEXT_SIZE_COOKIE = "pocket-ts"
const ONE_YEAR = 60 * 60 * 24 * 365

export function parseTextSize(value: string | undefined): TextSize {
  const n = Number(value)
  return TEXT_SIZES.find((s) => s.value === n)?.value ?? 1
}

/** Client only: applies the size straight away and remembers it. */
export function applyTextSize(size: TextSize) {
  document.documentElement.style.setProperty("--ts", String(size))
  document.cookie = `${TEXT_SIZE_COOKIE}=${size}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}
