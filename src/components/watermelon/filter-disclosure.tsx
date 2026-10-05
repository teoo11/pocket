/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: generic groups of single-choice options and on/off switches; a "Filters" button with a
 * count that opens an animated panel; Apply / Clear; large touch targets; lucide icons.
 */
"use client"

import { AnimatePresence, motion } from "motion/react"
import { SlidersHorizontal, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

/** A row of single-choice options, or an on/off switch (value "1" or "0"). */
export type FilterGroup =
  | { id: string; label: string; kind?: "choice"; options: { value: string; label: string }[] }
  | { id: string; label: string; kind: "toggle"; hint?: string }

export function FilterDisclosure({
  groups,
  value,
  defaults,
  activeCount,
  onApply,
  labels,
  toolbar,
}: {
  groups: FilterGroup[]
  value: Record<string, string>
  /** What "Clear" goes back to. */
  defaults: Record<string, string>
  /** Shown on the button: how many filters narrow the results. */
  activeCount: number
  onApply: (next: Record<string, string>) => void
  labels: { button: string; apply: string; clear: string; close: string }
  /** Controls shown on the same row as the Filters button; the panel opens full-width below them. */
  toolbar?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          aria-expanded={open}
          onClick={() => {
            setDraft(value)
            setOpen((o) => !o)
          }}
        >
          <SlidersHorizontal aria-hidden />
          {labels.button}
          {activeCount ? (
            <span className="rounded-full bg-foreground px-2 text-sm text-background tabular-nums">{activeCount}</span>
          ) : null}
        </Button>
        {toolbar}
      </div>
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
              {groups.map((g) =>
                g.kind === "toggle" ? (
                  <div key={g.id} className="flex items-center justify-between gap-4 rounded-2xl bg-wm-tile px-4 py-3">
                    <label htmlFor={`filter-${g.id}`} className="flex flex-col">
                      <span className="font-semibold">{g.label}</span>
                      {g.hint ? <span className="text-[0.9375rem] text-muted-foreground">{g.hint}</span> : null}
                    </label>
                    <Switch
                      id={`filter-${g.id}`}
                      checked={draft[g.id] === "1"}
                      onCheckedChange={(on) => setDraft({ ...draft, [g.id]: on ? "1" : "0" })}
                    />
                  </div>
                ) : (
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
                ),
              )}
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
