import { redirect } from "next/navigation"

import { parseSearch, searchHref } from "@/features/jobs/search-params"

/** The search now lives on Home; old links keep their filters. */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const state = parseSearch(await searchParams)
  redirect(searchHref(state, { limit: state.limit }))
}
