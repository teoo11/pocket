"use client"

import { APIProvider } from "@vis.gl/react-google-maps"
import { useLocale } from "next-intl"
import { createContext, useContext, useEffect, useState } from "react"

import { publicEnv } from "@/lib/env"

import { SERVICE_BOUNDS } from "../places"

const MapsState = createContext({ enabled: false, failed: false })

/** True when a Google Maps key is configured (inside a MapsProvider); otherwise pages show their map-less version. */
export function useMapsEnabled() {
  return useContext(MapsState).enabled
}

/**
 * True once Google rejected the key. Maps then stay mounted but hidden: removing a map while Google is still
 * setting it up makes Google's own code throw.
 */
export function useMapsFailed() {
  return useContext(MapsState).failed
}

/** Loads Google Maps once for the signed-in app, in the viewer's language, biased to Romania. */
export function MapsProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const key = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [failed, setFailed] = useState(false)
  // Google calls this when it rejects the key (wrong, expired, or not allowed on this site).
  useEffect(() => {
    const w = window as Window & { gm_authFailure?: () => void }
    w.gm_authFailure = () => setFailed(true)
  }, [])
  if (!key) return children
  return (
    <APIProvider apiKey={key} version="quarterly" language={locale} region="RO" onError={() => setFailed(true)}>
      <MapsState.Provider value={{ enabled: true, failed }}>{children}</MapsState.Provider>
    </APIProvider>
  )
}

export const MAP_ID = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID"

/** Shared options: flat (no tilt or rotation), no clutter, kept to Bucharest and Ilfov. */
export const BASE_MAP_OPTIONS = {
  mapId: MAP_ID,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  headingInteractionEnabled: false,
  tiltInteractionEnabled: false,
  minZoom: 9,
  restriction: { latLngBounds: SERVICE_BOUNDS, strictBounds: false },
} as const
