/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: items can be links (the selected tab lives in the URL) or buttons; optional counts
 * and disabled items; a scrolling "chips" look for long rows and a "segment" look for 2–3 options;
 * the active item scrolls into view; sizes in rem.
 */
"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export interface FluidTabItem {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  href?: string
  count?: number
  disabled?: boolean
  /** A small tag above the label, e.g. "NOW" on the current month. */
  tag?: string
}

type Props = {
  items: FluidTabItem[]
  active: string
  onChange?: (id: string) => void
  /** Unique per page, so two tab rows don't share one sliding pill. */
  layoutId: string
  label: string
  variant?: "chips" | "segment"
  className?: string
}

export function FluidTabs({ items, active, onChange, layoutId, label, variant = "chips", className }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = rowRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [active])

  return (
    <div
      ref={rowRef}
      role="tablist"
      aria-label={label}
      className={cn(
        "relative flex items-center gap-1.5",
        variant === "chips" && "-mx-4 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        variant === "segment" && "w-full rounded-2xl bg-wm-track p-1",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === active
        const inner = (
          <>
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 280, damping: 25, mass: 0.8 }}
                className={cn("absolute inset-0 rounded-full bg-foreground shadow-xs", variant === "segment" && "rounded-xl bg-card")}
              />
            ) : null}
            <motion.span
              animate={{ filter: isActive ? ["blur(0px)", "blur(4px)", "blur(0px)"] : "blur(0px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative z-10 flex items-center gap-2"
            >
              {item.icon}
              <span className="flex flex-col items-center leading-tight">
                {item.tag ? <span className="text-[0.625rem] font-extrabold tracking-wider">{item.tag}</span> : null}
                <span className="whitespace-nowrap">{item.label}</span>
              </span>
              {item.count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.8125rem] font-bold tabular-nums",
                    isActive ? "bg-background/20" : "bg-card",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </motion.span>
          </>
        )
        const classes = cn(
          "relative flex min-h-[2.875rem] shrink-0 items-center justify-center rounded-full px-[1.125rem] font-semibold no-underline transition-colors duration-200",
          variant === "chips" && !isActive && "bg-wm-track text-foreground hover:bg-secondary",
          variant === "segment" && "min-h-12 flex-1 rounded-xl px-3",
          isActive && (variant === "chips" ? "font-bold text-background" : "font-bold text-foreground"),
          !isActive && variant === "segment" && "text-muted-foreground hover:text-foreground",
          item.disabled && "pointer-events-none opacity-40",
        )
        return item.href && !item.disabled ? (
          <Link
            key={item.id}
            href={item.href}
            role="tab"
            aria-selected={isActive}
            scroll={false}
            onClick={() => onChange?.(item.id)}
            className={classes}
          >
            {inner}
          </Link>
        ) : (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => onChange?.(item.id)}
            className={classes}
          >
            {inner}
          </button>
        )
      })}
    </div>
  )
}
