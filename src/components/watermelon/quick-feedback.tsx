/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: 1–5 stars instead of thumbs up/down (as in the prototype's rating step); after
 * choosing, the pill grows to show the word for the rating and an Undo button; lucide icons; rem sizes.
 */
"use client"

import { AnimatePresence, LayoutGroup, motion, type Transition } from "motion/react"
import { Star, Undo2 } from "lucide-react"

import { cn } from "@/lib/utils"

const spring: Transition = { type: "spring", stiffness: 150, damping: 15, mass: 1 }

export function StarFeedback({
  value,
  onChange,
  labels,
  undoLabel,
  groupLabel,
  starLabel,
}: {
  value: number
  onChange: (stars: number) => void
  /** Words for 1–5 stars, e.g. ["Not good", …, "Excellent!"]. */
  labels: [string, string, string, string, string]
  undoLabel: string
  groupLabel: string
  starLabel: (n: number) => string
}) {
  return (
    <LayoutGroup>
      <motion.div
        layout
        transition={spring}
        className={cn(
          "flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl border-[1.6px] border-border bg-card px-2 py-1.5",
          value > 0 && "bg-sun-soft",
        )}
      >
        <div role="radiogroup" aria-label={groupLabel} className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button
              layout
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={starLabel(n)}
              onClick={() => onChange(n)}
              whileTap={{ scale: 0.85 }}
              className="grid size-12 place-items-center rounded-lg"
            >
              <Star
                className={cn("size-8 transition-colors", value >= n ? "fill-sun text-sun-text" : "text-faint")}
                strokeWidth={1.5}
                aria-hidden
              />
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {value > 0 ? (
            <motion.div
              key="chosen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={spring}
              className="flex items-center gap-2 pr-1"
            >
              <span className="font-bold text-sun-text" aria-live="polite">
                {labels[value - 1]}
              </span>
              <button
                type="button"
                onClick={() => onChange(0)}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2.5 text-[0.9375rem] font-semibold text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <Undo2 className="size-4" aria-hidden />
                {undoLabel}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  )
}
