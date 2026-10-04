"use client"

import { Search, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { FilterDisclosure, type FilterGroup } from "@/components/watermelon/filter-disclosure"
import { fmtDist } from "@/lib/format"

import { CATEGORY_KEYS } from "../categories"

export type SearchState = { q: string; cat: string; dist: string; minPay: string; when: string; sort: string }
export const SEARCH_DEFAULTS: SearchState = { q: "", cat: "all", dist: "0", minPay: "0", when: "any", sort: "near" }

/** Search box, the Filters panel and removable chips; everything lives in the URL. */
export function SearchControls({ state }: { state: SearchState }) {
  const t = useTranslations("search")
  const tc = useTranslations("categories")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState(state.q)

  const go = (next: Partial<SearchState>) => {
    const merged = { ...state, ...next }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v && v !== SEARCH_DEFAULTS[k as keyof SearchState]) params.set(k, v)
    router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false })
  }

  const groups: FilterGroup[] = [
    { id: "cat", label: t("kind"), options: [{ value: "all", label: tc("all") }, ...CATEGORY_KEYS.map((k) => ({ value: k, label: tc(k) }))] },
    { id: "dist", label: t("howFar"), options: [{ value: "0", label: t("anyDistance") }, ...[1000, 2000, 5000].map((m) => ({ value: String(m), label: t("upTo", { dist: fmtDist(m, locale) }) }))] },
    { id: "minPay", label: t("pay"), options: [{ value: "0", label: t("anyPay") }, ...[20, 30, 50].map((n) => ({ value: String(n), label: t("orMore", { n }) }))] },
    { id: "when", label: t("when"), options: ["any", "today", "tomorrow", "week", "weekend"].map((w) => ({ value: w, label: t(`whenOpts.${w}`) })) },
    { id: "sort", label: t("sort"), options: ["near", "pay", "soon"].map((s) => ({ value: s, label: t(`sortOpts.${s}`) })) },
  ]
  const chips = groups.filter((g) => g.id !== "sort" && state[g.id as keyof SearchState] !== SEARCH_DEFAULTS[g.id as keyof SearchState])

  return (
    <div className="flex flex-col gap-3">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          go({ q: q.trim() })
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("placeholder")} aria-label={t("label")} className="pl-12" />
      </form>
      <FilterDisclosure
        groups={groups}
        value={{ cat: state.cat, dist: state.dist, minPay: state.minPay, when: state.when, sort: state.sort }}
        onApply={(next) => go(next)}
        labels={{ button: t("filters"), apply: t("apply"), clear: t("clear"), close: t("close") }}
      />
      {chips.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("active")}>
          {chips.map((g) => {
            const value = state[g.id as keyof SearchState]
            const label = g.options.find((o) => o.value === value)?.label ?? value
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => go({ [g.id]: SEARCH_DEFAULTS[g.id as keyof SearchState] })}
                  className="flex min-h-11 items-center gap-1.5 rounded-full bg-brand-soft px-3.5 font-semibold text-brand-text"
                  aria-label={t("remove", { filter: label })}
                >
                  {label}
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
