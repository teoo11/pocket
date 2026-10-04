"use client"

import { MinorsNote } from "../components/job-details"
import type { CategoryKey } from "../categories"

/** The minors note on the last posting step (same component, rendered from the client wizard). */
export function MinorsNoteClient({ category, startMin, durMin }: { category: CategoryKey; startMin: number; durMin: number }) {
  return <MinorsNote job={{ category, start_min: startMin, dur_min: durMin }} />
}
