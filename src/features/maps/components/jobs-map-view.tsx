"use client"

import dynamic from "next/dynamic"

import type { JobCard } from "@/features/jobs/queries"

import { MapsProvider } from "./maps-provider"

// Google Maps downloads only when the map view is opened.
const JobsMap = dynamic(() => import("./jobs-map").then((m) => m.JobsMap), {
  ssr: false,
  loading: () => <div className="h-[70dvh] min-h-[26rem] animate-pulse rounded-[1.25rem] bg-wm-track motion-reduce:animate-none" aria-hidden />,
})

/** The Map view of the search on Home: the same results as the list, as price pins. */
export function JobsMapView(props: { jobs: JobCard[]; origin: { lat: number; lng: number }; nearMe: boolean }) {
  return (
    <MapsProvider>
      <JobsMap {...props} />
    </MapsProvider>
  )
}
