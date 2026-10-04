/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: generic groups of single-choice options; a "Filters" button with a count that
 * opens an animated panel; Apply / Clear; large touch targets; lucide icons.
 */
"use client"

import { AnimatePresence, motion } from "motion/react"
import { SlidersHorizontal, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FilterGroup = { id: string; label: string; options: { value: string; label: string }[] }

export function FilterDisclosure({
  groups,
  value,
  onApply,
  labels,
}: {
  groups: FilterGroup[]
  value: Record<string, string>
  onApply: (next: Record<string, string>) => void
  labels: { button: string; apply: string; clear: string; close: string }
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const defaults = Object.fromEntries(groups.map((g) => [g.id, g.options[0].value]))
  const active = groups.filter((g) => g.id !== "sort" && value[g.id] !== defaults[g.id]).length

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        aria-expanded={open}
        onClick={() => {
          setDraft(value)
          setOpen((o) => !o)
        }}
        className="self-start"
      >
        <SlidersHorizontal aria-hidden />
        {labels.button}
        {active ? <span className="rounded-full bg-foreground px-2 text-sm text-background tabular-nums">{active}</span> : null}
      </Button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 rounded-3xl border-[1.6px] border-border bg-card p-4 shadow-wm-pop">
              <div className="flex items-center justify-between">
                <b className="text-lg">{labels.button}</b>
                <Button variant="ghost" size="icon" aria-label={labels.close} onClick={() => setOpen(false)}>
                  <X aria-hidden />
                </Button>
              </div>
              {groups.map((g) => (
                <fieldset key={g.id} className="flex flex-col gap-2">
                  <legend className="mb-2 font-semibold">{g.label}</legend>
                  <div role="radiogroup" aria-label={g.label} className="flex flex-wrap gap-2">
                    {g.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={draft[g.id] === o.value}
                        onClick={() => setDraft({ ...draft, [g.id]: o.value })}
                        className={cn(
                          "min-h-11 rounded-full border-[1.6px] border-input px-4 font-semibold",
                          draft[g.id] === o.value && "border-foreground bg-foreground text-background",
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDraft(defaults)}>
                  {labels.clear}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    onApply(draft)
                    setOpen(false)
                  }}
                >
                  {labels.apply}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
