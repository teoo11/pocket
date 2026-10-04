/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: controlled only; configurable step and a unit ("min", "lei"); labelled buttons and a
 * live region for screen readers; theme colours; large rem sizes (buttons 54px+).
 */
"use client"

import { AnimatePresence, motion } from "motion/react"
import { Minus, Plus } from "lucide-react"
import { useState } from "react"

const digitVariants = {
  initial: (dir: number) => ({ y: dir > 0 ? 20 : -20, opacity: 0, scale: 0.5, filter: "blur(2px)" }),
  animate: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ y: dir > 0 ? -20 : 20, opacity: 0, scale: 0.5, filter: "blur(2px)" }),
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  unit,
  label,
  lessLabel,
  moreLabel,
}: {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  label: string
  lessLabel: string
  moreLabel: string
}) {
  const [direction, setDirection] = useState(0)
  // Each digit animates only when it changes: a "tick" per position, bumped on change.
  const digits = String(value).split("")
  const [prev, setPrev] = useState<{ digits: string[]; ticks: number[] }>({ digits, ticks: digits.map(() => 0) })
  if (prev.digits.join("") !== digits.join("")) {
    const lenDiff = digits.length - prev.digits.length
    const ticks = digits.map((d, i) => {
      const pi = i - lenDiff
      const before = pi >= 0 ? prev.ticks[pi] ?? 0 : 0
      return pi >= 0 && prev.digits[pi] === d ? before : before + 1
    })
    setPrev({ digits, ticks })
  }

  const change = (dir: number) => {
    const next = Math.min(max, Math.max(min, value + dir * step))
    if (next === value) return
    setDirection(dir)
    onChange(next)
  }

  const btn =
    "grid size-[3.5rem] shrink-0 place-items-center rounded-full bg-wm-tile text-muted-foreground disabled:opacity-40"

  return (
    <div className="flex flex-col items-center gap-2" role="group" aria-label={label}>
      <span className="font-semibold">{label}</span>
      <div className="flex items-center gap-4 rounded-full border-2 border-border bg-card p-1 shadow-wm-xs">
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => change(-1)} disabled={value <= min} aria-label={lessLabel} className={btn}>
          <Minus className="size-5" aria-hidden />
        </motion.button>
        <div className="flex min-w-24 items-baseline justify-center gap-1.5" aria-live="polite" aria-atomic>
          <span className="sr-only">
            {value} {unit}
          </span>
          <span className="relative flex h-10 items-center text-[2rem] font-bold [perspective:600px]" aria-hidden>
            {digits.map((digit, i) => (
              <span key={`${i}-${digits.length}`} className="relative h-10 w-[1.2rem]">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.span
                    key={prev.ticks[i]}
                    custom={direction}
                    variants={digitVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 200, damping: 16, mass: 1.2 }}
                    className="absolute inset-0 flex items-center justify-center tabular-nums"
                  >
                    {digit}
                  </motion.span>
                </AnimatePresence>
              </span>
            ))}
          </span>
          {unit ? (
            <span className="text-lg font-bold text-faint" aria-hidden>
              {unit}
            </span>
          ) : null}
        </div>
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => change(1)} disabled={value >= max} aria-label={moreLabel} className={btn}>
          <Plus className="size-5" aria-hidden />
        </motion.button>
      </div>
    </div>
  )
}
