"use client"

import dynamic from "next/dynamic"

import { MapsProvider } from "@/features/maps/components/maps-provider"

/** The wizard keeps its draft in sessionStorage, so it renders in the browser only. */
const PostWizard = dynamic(() => import("./wizard").then((m) => m.PostWizard), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-3xl bg-wm-track" aria-hidden />,
})

export function PostWizardClient(props: React.ComponentProps<typeof PostWizard>) {
  return (
    <MapsProvider>
      <PostWizard {...props} />
    </MapsProvider>
  )
}
