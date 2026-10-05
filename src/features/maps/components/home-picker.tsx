"use client"

import { Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { DEFAULT_CENTER, type Place } from "../places"
import { AddressPicker } from "./address-picker"
import { MapsProvider, useMapsEnabled, useMapsFailed } from "./maps-provider"
import { PlacePicker } from "./place-picker"

export type PickedHome = { lat: number; lng: number; label: string }

type Props = {
  label: string
  /** The current home, when changing it. */
  initial?: PickedHome | null
  onChange: (home: PickedHome) => void
  error?: string
}

/**
 * Where you live: a Google address search with a map pin, so distances to jobs are measured from your real
 * home. The street stays private; neighbours only ever see the neighbourhood. Without Google Maps (not set
 * up, or the key is refused) it falls back to the list of Bucharest and Ilfov neighbourhoods.
 */
export function HomePicker(props: Props) {
  return (
    <MapsProvider>
      <Picker {...props} />
    </MapsProvider>
  )
}

function Picker({ label, initial, onChange, error }: Props) {
  const t = useTranslations("places")
  const enabled = useMapsEnabled()
  const failed = useMapsFailed()
  const [place, setPlace] = useState<Place | null>(null)
  // The picked point drives the pin; until then, the current home (or the city centre).
  const [current, setCurrent] = useState<PickedHome | null>(initial ?? null)

  if (!enabled || failed) {
    return (
      <PlacePicker
        label={label}
        value={place}
        error={error}
        onChange={(p) => {
          setPlace(p)
          onChange({ lat: p.lat, lng: p.lng, label: p.name })
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <AddressPicker
        mode="home"
        label={label}
        placeholder={t("addressPlaceholder")}
        value={{
          lat: current?.lat ?? DEFAULT_CENTER.lat,
          lng: current?.lng ?? DEFAULT_CENTER.lng,
          address: initial?.label ?? "",
        }}
        onChange={(v) => {
          const home = { lat: v.lat, lng: v.lng, label: v.address.slice(0, 120) || v.area }
          setCurrent(home)
          onChange(home)
        }}
      />
      <p className="flex items-start gap-1.5 text-[0.9375rem] text-muted-foreground">
        <Lock className="mt-1 size-3.5 shrink-0" aria-hidden />
        {t("addressPrivate")}
      </p>
      {error ? (
        <p role="alert" className="font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
