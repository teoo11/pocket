"use client"

import { AdvancedMarker, Map, useMapsLibrary } from "@vis.gl/react-google-maps"
import { MapPin } from "lucide-react"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useId, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { useHydrated } from "@/lib/use-hydrated"
import { cn } from "@/lib/utils"

import { inServiceArea, nearestPlace, SERVICE_BOUNDS } from "../places"
import { MapBoundary } from "./map-boundary"
import { BASE_MAP_OPTIONS, useMapsFailed } from "./maps-provider"

export type PickedAddress = {
  lat: number
  lng: number
  address: string
  area: string
}

type Suggestion = {
  id: string
  main: string
  rest: string
  prediction: google.maps.places.PlacePrediction
}

/**
 * Street address with Google Places (New) suggestions limited to Bucharest and Ilfov, and a map to put the pin
 * exactly (tap or drag; the street is then filled in by reverse geocoding).
 * - "job" mode: typing without picking a suggestion is fine too; the text is kept as written, the pin stays.
 * - "home" mode: only a picked suggestion or a placed pin counts (the point is what distances are measured from).
 */
export function AddressPicker({
  id: givenId,
  label,
  placeholder,
  value,
  onChange,
  mode = "job",
}: {
  id?: string
  label: string
  placeholder?: string
  value: { lat: number; lng: number; address: string }
  onChange: (v: PickedAddress) => void
  mode?: "job" | "home"
}) {
  const t = useTranslations("map")
  const locale = useLocale()
  const { resolvedTheme } = useTheme()
  // The theme is known only in the browser; create the map once, after hydration, with the right colours.
  const hydrated = useHydrated()
  const failed = useMapsFailed()
  const places = useMapsLibrary("places")
  const geocoding = useMapsLibrary("geocoding")
  const autoId = useId()
  const id = givenId ?? autoId
  const listId = `${id}-list`
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(false)
  const [outside, setOutside] = useState(false)
  const [center, setCenter] = useState({ lat: value.lat, lng: value.lng })
  const [text, setText] = useState(value.address)
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const latest = useRef(0)

  const emit = (lat: number, lng: number, address: string) => {
    if (!inServiceArea(lat, lng)) {
      setOutside(true)
      return
    }
    setOutside(false)
    setText(address)
    onChange({ lat, lng, address, area: nearestPlace(lat, lng).name })
  }

  // Suggestions as you type (debounced). One session token per search, ended by picking a place.
  useEffect(() => {
    const input = text.trim()
    if (!places || !open || input.length < 3) return
    const request = ++latest.current
    const timer = setTimeout(async () => {
      token.current ??= new places.AutocompleteSessionToken()
      try {
        const { suggestions: found } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: token.current,
          locationRestriction: SERVICE_BOUNDS,
          includedRegionCodes: ["ro"],
          language: locale,
        })
        if (request !== latest.current) return
        setSuggestions(
          found
            .map((s) => s.placePrediction)
            .filter((p): p is google.maps.places.PlacePrediction => !!p)
            .slice(0, 5)
            .map((p) => ({
              id: p.placeId,
              main: p.mainText?.text ?? p.text.text,
              rest: p.secondaryText?.text ?? "",
              prediction: p,
            })),
        )
        setActive(-1)
      } catch {
        setSuggestions([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [places, text, open, locale])

  const pick = async (s: Suggestion) => {
    setOpen(false)
    setSuggestions([])
    const place = s.prediction.toPlace()
    await place.fetchFields({ fields: ["location", "formattedAddress"] })
    token.current = null
    const loc = place.location
    if (!loc) return
    const address = shortAddress(place.formattedAddress ?? s.main)
    setCenter({ lat: loc.lat(), lng: loc.lng() })
    emit(loc.lat(), loc.lng(), address)
  }

  const placePin = async (lat: number, lng: number) => {
    if (!inServiceArea(lat, lng)) {
      setOutside(true)
      return
    }
    let address = text
    if (geocoding) {
      try {
        const { results } = await new geocoding.Geocoder().geocode({
          location: { lat, lng },
          language: locale,
        })
        const street = results.find((r) => r.types.includes("street_address") || r.types.includes("premise")) ?? results[0]
        if (street) address = shortAddress(street.formatted_address)
      } catch {
        // Keep what was typed.
      }
    }
    emit(lat, lng, address)
  }

  const showList = open && suggestions.length > 0 && text.trim().length >= 3

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex flex-col gap-2">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <Input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={text}
          maxLength={200}
          placeholder={placeholder}
          onChange={(e) => {
            setOpen(true)
            setText(e.target.value)
            if (e.target.value.trim().length < 3) setSuggestions([])
            if (mode === "job") {
              onChange({ lat: value.lat, lng: value.lng, address: e.target.value, area: nearestPlace(value.lat, value.lng).name })
            }
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!showList) return
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, suggestions.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === "Enter" && active >= 0) {
              e.preventDefault()
              void pick(suggestions[active])
            } else if (e.key === "Escape") {
              setOpen(false)
            }
          }}
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={t("suggestions")}
            className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border-[1.6px] border-border bg-card shadow-lg"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void pick(s)}
                className={cn("flex min-h-12 cursor-pointer items-center gap-2.5 px-4 py-2", i === active && "bg-brand-soft")}
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex min-w-0 flex-col">
                  <b className="truncate">{s.main}</b>
                  <span className="truncate text-sm text-muted-foreground">{s.rest}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        className="h-56 overflow-hidden rounded-[1.25rem] border-[1.6px] border-border"
        role="region"
        aria-label={t("pickLabel")}
        hidden={failed}
      >
        {hydrated ? (
          <MapBoundary>
            <Map
              key={resolvedTheme}
              {...BASE_MAP_OPTIONS}
              colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"}
              center={center}
              onCameraChanged={(e) => setCenter(e.detail.center)}
              defaultZoom={16}
              gestureHandling="cooperative"
              onClick={(e) => e.detail.latLng && void placePin(e.detail.latLng.lat, e.detail.latLng.lng)}
              className="size-full"
            >
              <AdvancedMarker
                position={{ lat: value.lat, lng: value.lng }}
                draggable
                title={t("pin")}
                onDragEnd={(e) => e.latLng && void placePin(e.latLng.lat(), e.latLng.lng())}
              />
            </Map>
          </MapBoundary>
        ) : null}
      </div>
      <p
        className={cn("text-[0.9375rem]", outside ? "font-semibold text-destructive" : "text-muted-foreground")}
        role={outside ? "alert" : undefined}
        hidden={failed && !outside}
      >
        {outside ? t("outside") : t("pickHint")}
      </p>
    </div>
  )
}

/** "Strada Glinka 8, București 020000, Romania" -> "Strada Glinka 8, București". */
function shortAddress(formatted: string): string {
  return formatted
    .replace(/,\s*(Romania|România)$/i, "")
    .replace(/\s+\d{6}\b/, "")
    .trim()
}
