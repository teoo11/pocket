"use client"

import { AdvancedMarker, Circle, Map } from "@vis.gl/react-google-maps"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import { useHydrated } from "@/lib/use-hydrated"

import { MapBoundary } from "./map-boundary"
import { BASE_MAP_OPTIONS, MapsProvider, useMapsEnabled, useMapsFailed } from "./maps-provider"

type Props = {
  lat: number
  lng: number
  /** Exact point (the poster, and the helper after the pick); otherwise the public point, shown as an area. */
  exact: boolean
}

/** The small map on a job page. Others see a circle around the shifted public point, never the address. */
export function JobMiniMap(props: Props) {
  return (
    <MapsProvider>
      <MiniMap {...props} />
    </MapsProvider>
  )
}

function MiniMap({ lat, lng, exact }: Props) {
  const t = useTranslations("map")
  const enabled = useMapsEnabled()
  const failed = useMapsFailed()
  const { resolvedTheme } = useTheme()
  // The theme is known only in the browser; create the map once, after hydration, with the right colours.
  const hydrated = useHydrated()
  if (!enabled) return null
  const center = { lat, lng }
  return (
    <figure className={failed ? "hidden" : "flex flex-col gap-1.5"}>
      <div
        className="h-52 overflow-hidden rounded-[1.25rem] border-[1.6px] border-border"
        role="region"
        aria-label={exact ? t("exactLabel") : t("areaLabel")}
      >
        {hydrated ? (
          <MapBoundary>
            <Map
              key={resolvedTheme}
              {...BASE_MAP_OPTIONS}
              colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"}
              defaultCenter={center}
              defaultZoom={exact ? 16 : 15}
              gestureHandling="cooperative"
              className="size-full"
            >
              {exact ? (
                <AdvancedMarker position={center} title={t("pin")} />
              ) : (
                <Circle
                  center={center}
                  radius={250}
                  strokeColor="#b5705a"
                  strokeOpacity={0.9}
                  strokeWeight={1.5}
                  fillColor="#b5705a"
                  fillOpacity={0.15}
                  clickable={false}
                />
              )}
            </Map>
          </MapBoundary>
        ) : null}
      </div>
      <figcaption className="text-[0.9375rem] text-muted-foreground">{exact ? t("exactNote") : t("areaNote")}</figcaption>
    </figure>
  )
}
