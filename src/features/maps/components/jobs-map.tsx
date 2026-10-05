"use client"

import { AdvancedMarker, ControlPosition, Map, useMap } from "@vis.gl/react-google-maps"
import { Home, LocateFixed, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { JobRow } from "@/features/jobs/components/job-bits"
import type { JobCard } from "@/features/jobs/queries"
import { useHydrated } from "@/lib/use-hydrated"
import { cn } from "@/lib/utils"

import { PLACES } from "../places"
import { MapBoundary } from "./map-boundary"
import { BASE_MAP_OPTIONS, useMapsEnabled, useMapsFailed } from "./maps-provider"

type LatLng = { lat: number; lng: number }

/**
 * The map of open jobs: a price pin at each job's public (approximate) point, a preview card when one is tapped,
 * "My home" (or "Where I am") and "Go to…" a neighbourhood. Exact addresses are never sent to the browser.
 */
export function JobsMap({ jobs, origin, nearMe }: { jobs: JobCard[]; origin: LatLng; nearMe: boolean }) {
  const t = useTranslations("map")
  const enabled = useMapsEnabled()
  const failed = useMapsFailed()
  const { resolvedTheme } = useTheme()
  // The theme is known only in the browser; create the map once, after hydration, with the right colours.
  const hydrated = useHydrated()
  const [selected, setSelected] = useState<string | null>(null)
  const pins = jobs.filter((j) => j.lat != null && j.lng != null)
  const job = pins.find((j) => j.id === selected) ?? null

  const unavailable = <p className="rounded-2xl bg-secondary px-4 py-6 text-center text-muted-foreground">{t("unavailable")}</p>
  if (!enabled) return unavailable

  return (
    <>
      {failed ? unavailable : null}
      <div
        role="region"
        aria-label={t("label")}
        hidden={failed}
        className="relative h-[70dvh] min-h-[26rem] overflow-hidden rounded-[1.25rem] border-[1.6px] border-border"
      >
        {hydrated ? (
          <MapBoundary>
            <Map
              key={resolvedTheme}
              {...BASE_MAP_OPTIONS}
              colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"}
              defaultCenter={origin}
              defaultZoom={14}
              gestureHandling="greedy"
              // Top right: the "Post a job" button sits in the bottom-right corner.
              zoomControlOptions={{ position: ControlPosition.RIGHT_TOP }}
              onClick={() => setSelected(null)}
              className="size-full"
            >
              <AdvancedMarker position={origin} title={nearMe ? t("here") : t("home")} zIndex={1}>
                <span
                  className="grid size-9 place-items-center rounded-full border-2 border-white bg-sky text-white shadow-md"
                  aria-hidden
                >
                  {nearMe ? (
                    <LocateFixed className="size-4.5" strokeWidth={2.2} />
                  ) : (
                    <Home className="size-4.5" strokeWidth={2.2} />
                  )}
                </span>
              </AdvancedMarker>
              {pins.map((j) => (
                <AdvancedMarker
                  key={j.id}
                  position={{ lat: j.lat!, lng: j.lng! }}
                  title={`${j.title}, ${j.pay_lei} lei`}
                  zIndex={j.id === selected ? 3 : 2}
                  onClick={() => setSelected(j.id)}
                >
                  <span
                    className={cn(
                      "block rounded-full border-2 border-white px-2.5 py-1 text-sm font-extrabold shadow-md tabular-nums",
                      j.id === selected ? "scale-110 bg-foreground text-background" : "bg-primary text-primary-foreground",
                    )}
                  >
                    {j.pay_lei} lei
                  </span>
                </AdvancedMarker>
              ))}
              <MapTools origin={origin} nearMe={nearMe} />
            </Map>
          </MapBoundary>
        ) : null}

        {job ? (
          <div className="absolute inset-x-3 bottom-3 flex flex-col desk:right-auto desk:left-3 desk:w-[26rem]">
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-3 -right-1 z-10 size-10 rounded-full shadow-md"
              aria-label={t("close")}
              onClick={() => setSelected(null)}
            >
              <X aria-hidden />
            </Button>
            <div className="shadow-lg">
              <JobRow job={job} />
            </div>
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {t("count", { count: pins.length })}
        </p>
      </div>
    </>
  )
}

/** Back to the origin ("My home" / "Where I am") and a "Go to…" list of the 80 places, on top of the map. */
function MapTools({ origin, nearMe }: { origin: LatLng; nearMe: boolean }) {
  const t = useTranslations("map")
  const map = useMap()
  const go = (p: LatLng, zoom = 15) => {
    map?.panTo(p)
    map?.setZoom(zoom)
  }
  return (
    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" className="shadow-md" onClick={() => go(origin)}>
        {nearMe ? <LocateFixed aria-hidden /> : <Home aria-hidden />}
        {nearMe ? t("here") : t("home")}
      </Button>
      <select
        aria-label={t("goTo")}
        defaultValue=""
        onChange={(e) => {
          const p = PLACES.find((x) => String(x.id) === e.target.value)
          if (p) go(p)
        }}
        className="h-12 rounded-lg border-[1.6px] border-border bg-card px-3 font-semibold shadow-md"
      >
        <option value="" disabled>
          {t("goTo")}
        </option>
        <optgroup label={t("bucharest")}>
          {PLACES.filter((p) => p.zone !== "Ilfov").map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
        <optgroup label={t("ilfov")}>
          {PLACES.filter((p) => p.zone === "Ilfov").map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
