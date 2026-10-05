"use client"

import { House, LayoutGrid, Loader2, LocateFixed, Map as MapIcon, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterDisclosure, type FilterGroup } from "@/components/watermelon/filter-disclosure"
import { FluidTabs } from "@/components/watermelon/fluid-tabs"
import { fmtDist } from "@/lib/format"
import { TONE_CLASSES } from "@/lib/tones"
import { cn } from "@/lib/utils"

import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "../categories"
import { clearSearchOrigin, setSearchOrigin } from "../origin-actions"
import {
  activeFilters,
  DIST_OPTIONS,
  type FilterKey,
  PAY_OPTIONS,
  SEARCH_DEFAULTS,
  searchHref,
  type SearchState,
  SORT_OPTIONS,
  WHEN_OPTIONS,
} from "../search-params"

/**
 * The search on Home: text, Filters (distance, pay, when, sort, examples), category chips with live counts,
 * where distances are measured from, and List / Map. Everything is in the URL; the server does the search.
 */
export function JobSearch({
  state,
  counts,
  nearMe,
}: {
  state: SearchState
  counts: Partial<Record<CategoryKey, number>>
  /** True when distances are from the phone's position ("Near me now"), not from home. */
  nearMe: boolean
}) {
  const t = useTranslations("search")
  const tc = useTranslations("categories")
  const locale = useLocale()
  const router = useRouter()
  const [q, setQ] = useState(state.q)
  const go = (patch: Partial<SearchState>) => router.push(searchHref(state, patch), { scroll: false })

  const total = CATEGORY_KEYS.reduce((sum, k) => sum + (counts[k] ?? 0), 0)

  // Filter panel: radio rows plus the examples switch. Values are strings in the panel.
  const groups: FilterGroup[] = [
    {
      id: "dist",
      label: t("howFar"),
      options: DIST_OPTIONS.map((m) => ({
        value: String(m),
        label: m ? t("upTo", { dist: fmtDist(m, locale) }) : t("anyDistance"),
      })),
    },
    {
      id: "minPay",
      label: t("pay"),
      options: PAY_OPTIONS.map((n) => ({ value: String(n), label: n ? t("orMore", { n }) : t("anyPay") })),
    },
    { id: "when", label: t("when"), options: WHEN_OPTIONS.map((w) => ({ value: w, label: t(`whenOpts.${w}`) })) },
    { id: "sort", label: t("sort"), options: SORT_OPTIONS.map((s) => ({ value: s, label: t(`sortOpts.${s}`) })) },
    { id: "examples", label: t("examples"), kind: "toggle", hint: t("examplesHint") },
  ]
  const asPanel = (s: SearchState) => ({
    dist: String(s.dist),
    minPay: String(s.minPay),
    when: s.when,
    sort: s.sort,
    examples: s.examples ? "1" : "0",
  })
  const fromPanel = (v: Record<string, string>): Partial<SearchState> => ({
    dist: Number(v.dist) as SearchState["dist"],
    minPay: Number(v.minPay) as SearchState["minPay"],
    when: v.when as SearchState["when"],
    sort: v.sort as SearchState["sort"],
    examples: v.examples === "1",
  })

  const chipLabel = (k: FilterKey): string => {
    if (k === "dist") return t("upTo", { dist: fmtDist(state.dist, locale) })
    if (k === "minPay") return t("orMore", { n: state.minPay })
    if (k === "when") return t(`whenOpts.${state.when}`)
    return t("noExamples")
  }
  const chips = activeFilters(state)

  return (
    <section aria-labelledby="search-title" className="flex flex-col gap-3">
      <h2 id="search-title" className="sr-only">
        {t("title")}
      </h2>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          go({ q: q.trim() })
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="search"
          type="search"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("label")}
          maxLength={80}
          className="pr-12 pl-12"
        />
        {q ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 size-11 -translate-y-1/2"
            aria-label={t("clearText")}
            onClick={() => {
              setQ("")
              if (state.q) go({ q: "" })
            }}
          >
            <X aria-hidden />
          </Button>
        ) : null}
      </form>

      <FilterDisclosure
        key={JSON.stringify(asPanel(state))}
        groups={groups}
        value={asPanel(state)}
        defaults={asPanel(SEARCH_DEFAULTS)}
        activeCount={chips.length}
        onApply={(v) => go(fromPanel(v))}
        labels={{ button: t("filters"), apply: t("apply"), clear: t("clear"), close: t("close") }}
        toolbar={
          <FluidTabs
            layoutId="search-view"
            label={t("view")}
            variant="segment"
            active={state.view}
            className="ml-auto w-auto min-w-[13rem]"
            items={[
              {
                id: "list",
                label: t("list"),
                icon: <LayoutGrid className="size-4.5" strokeWidth={1.7} aria-hidden />,
                href: searchHref(state, { view: "list", limit: state.limit }),
              },
              {
                id: "map",
                label: t("map"),
                icon: <MapIcon className="size-4.5" strokeWidth={1.7} aria-hidden />,
                href: searchHref(state, { view: "map", limit: state.limit }),
              },
            ]}
          />
        }
      />

      <FluidTabs
        layoutId="search-cats"
        label={t("kind")}
        active={state.cat}
        items={[
          { id: "all", label: tc("all"), count: total, href: searchHref(state, { cat: "all" }) },
          ...CATEGORY_KEYS.map((k) => {
            const { icon: Icon, tone } = CATEGORIES[k]
            return {
              id: k,
              label: tc(k),
              count: counts[k] ?? 0,
              dimmed: !counts[k],
              href: searchHref(state, { cat: k }),
              icon: (
                <span className={cn("grid size-7 place-items-center rounded-full", TONE_CLASSES[tone])} aria-hidden>
                  <Icon className="size-4" strokeWidth={1.7} />
                </span>
              ),
            }
          }),
        ]}
      />

      {chips.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("active")}>
          {chips.map((k) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => go({ [k]: SEARCH_DEFAULTS[k] })}
                className="flex min-h-11 items-center gap-1.5 rounded-full bg-brand-soft px-3.5 font-semibold text-brand-text"
                aria-label={t("remove", { filter: chipLabel(k) })}
              >
                {chipLabel(k)}
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <OriginSwitch nearMe={nearMe} />
    </section>
  )
}

/** "Distances from your home" / "from where you are now", with the switch between them. */
function OriginSwitch({ nearMe }: { nearMe: boolean }) {
  const t = useTranslations("search")
  const tErr = useTranslations("errors")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [locating, setLocating] = useState(false)

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      toast.error(t("locationUnavailable"))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        startTransition(async () => {
          const r = await setSearchOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocating(false)
          if (!r.ok) toast.error(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
          router.refresh()
        }),
      () => {
        setLocating(false)
        toast.error(t("locationDenied"))
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  const busy = pending || locating
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        {nearMe ? <LocateFixed className="size-4" aria-hidden /> : <House className="size-4" aria-hidden />}
        {nearMe ? t("fromHere") : t("fromHome")}
      </span>
      <Button
        variant="quiet"
        size="sm"
        className="min-h-11 px-2"
        disabled={busy}
        onClick={() =>
          nearMe
            ? startTransition(async () => {
                await clearSearchOrigin()
                router.refresh()
              })
            : locateMe()
        }
      >
        {busy ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
        {nearMe ? t("backHome") : t("useHere")}
      </Button>
    </div>
  )
}
