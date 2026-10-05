import { redirect } from "next/navigation"

import { parseSearch, searchHref } from "@/features/jobs/search-params"

/** The map is the Map view of the search on Home; old links keep their filters. */
export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const state = parseSearch(await searchParams)
  redirect(searchHref(state, { view: "map", limit: state.limit }))
}
