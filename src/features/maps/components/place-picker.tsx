"use client"

import { MapPin, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { findPlaces, type Place } from "../places"

/** Pick a Bucharest/Ilfov neighbourhood or town by typing part of its name (the prototype's place picker). */
export function PlacePicker({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: Place | null
  onChange: (place: Place) => void
  error?: string
}) {
  const t = useTranslations("places")
  const [query, setQuery] = useState("")
  const id = useId()
  const results = useMemo(() => findPlaces(query).slice(0, query ? 20 : 80), [query])

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-4 py-3 text-brand-text">
          <MapPin className="size-5" aria-hidden />
          <b>{value.name}</b>
          <span className="text-[0.9375rem]">{value.zone}</span>
        </div>
      ) : null}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className="pl-12"
          aria-invalid={error ? true : undefined}
          aria-controls={`${id}-list`}
        />
      </div>
      {error ? <p className="text-[0.9375rem] font-semibold text-destructive">{error}</p> : null}
      {value && !query ? (
        <p className="text-[0.9375rem] text-muted-foreground">{t("changeHint")}</p>
      ) : (
        <div
          id={`${id}-list`}
          role="radiogroup"
          aria-label={label}
          className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border-[1.6px] border-border bg-card p-1.5 sm:grid-cols-2"
        >
          {results.length ? (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={value?.id === p.id}
                onClick={() => {
                  onChange(p)
                  setQuery("")
                }}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-start justify-center rounded-md px-3 py-1.5 text-left hover:bg-wm-tile",
                  value?.id === p.id && "bg-brand-soft text-brand-text",
                )}
              >
                <b className="leading-tight">{p.name}</b>
                <span className="text-sm text-muted-foreground">{p.zone}</span>
              </button>
            ))
          ) : (
            <p className="p-3 text-muted-foreground">{t("none")}</p>
          )}
        </div>
      )}
    </div>
  )
}
