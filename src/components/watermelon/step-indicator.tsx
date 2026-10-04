/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: shows progress through a wizard instead of hover tooltips: one bar per step,
 * the current step's label sits above its bar and slides along as you move (as in the prototype),
 * finished steps are buttons to go back; lucide icons; rem sizes.
 */
"use client"

import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export type StepItem = { id: string; label: string; icon: LucideIcon }

export function StepIndicator({
  steps,
  current,
  onGoTo,
  stepLabel,
}: {
  steps: StepItem[]
  current: number
  onGoTo: (index: number) => void
  /** "Step 2 of 8: Details" for screen readers. */
  stepLabel: (index: number) => string
}) {
  const Icon = steps[current].icon
  const pct = ((current + 0.5) / steps.length) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-9">
        <motion.span
          className="absolute top-0 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-sm font-bold whitespace-nowrap text-background"
          initial={false}
          animate={{ left: `clamp(3.5rem, ${pct}%, calc(100% - 3.5rem))` }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          aria-hidden
        >
          <Icon className="size-4" aria-hidden />
          {steps[current].label}
        </motion.span>
      </div>
      <ol className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              disabled={i >= current}
              onClick={() => onGoTo(i)}
              aria-current={i === current ? "step" : undefined}
              aria-label={stepLabel(i)}
              className="flex h-6 w-full items-center"
            >
              <span
                className={cn(
                  "h-2 w-full rounded-full bg-wm-track transition-colors",
                  i < current && "bg-primary",
                  i === current && "bg-foreground",
                )}
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
