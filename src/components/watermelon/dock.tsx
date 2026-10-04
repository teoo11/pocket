/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: items are links with labels and badges, the active item comes from the route,
 * lucide icons, sizes in rem so the Aa setting scales them.
 */
"use client"

import { motion, type Transition } from "motion/react"
import Link from "next/link"
import { useState } from "react"

import { cn } from "@/lib/utils"

export interface DockItem {
  href: string
  label: string
  Icon: React.ElementType
  active: boolean
  badge?: number
}

const dockSpring: Transition = { stiffness: 300, damping: 22, mass: 0.7 }
const popSpring: Transition = { type: "spring", stiffness: 550, damping: 15, mass: 1.1 }

export function Dock({ items, label, className }: { items: DockItem[]; label: string; className?: string }) {
  const [popped, setPopped] = useState<string | null>(null)

  return (
    <motion.nav
      aria-label={label}
      layout
      transition={dockSpring}
      className={cn(
        "flex w-max max-w-[calc(100vw-1.25rem)] items-end gap-1.5 rounded-[1.625rem] border-[1.5px] border-border bg-card px-2.5 pt-2 pb-1.5 shadow-wm-pop",
        className,
      )}
    >
      {items.map((item) => (
        <motion.div
          key={item.href}
          style={{ transformOrigin: "bottom" }}
          whileHover={{ y: -4 }}
          animate={{ scale: popped === item.href ? 1.3 : 1, y: popped === item.href ? -6 : 0 }}
          transition={popSpring}
        >
          <Link
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            onClick={() => {
              setPopped(item.href)
              setTimeout(() => setPopped(null), 200)
            }}
            className={cn(
              "relative flex min-w-[4.25rem] flex-col items-center gap-[3px] rounded-xl px-1 pb-2 text-faint no-underline transition-colors",
              item.active && "text-foreground",
            )}
          >
            <span
              className={cn(
                "relative grid h-10 w-11 place-items-center rounded-xl bg-wm-tile transition-colors",
                item.active && "bg-foreground text-background",
              )}
            >
              <item.Icon className="size-[1.375rem]" strokeWidth={1.7} aria-hidden />
              {item.badge ? <CountBadge n={item.badge} className="absolute -top-1.5 -right-2" /> : null}
            </span>
            <span className="text-[0.8125rem] font-semibold">{item.label}</span>
            <span
              aria-hidden
              className={cn(
                "absolute bottom-0 size-1 rounded-full bg-faint opacity-0 transition-opacity duration-400",
                item.active && "opacity-100",
              )}
            />
          </Link>
        </motion.div>
      ))}
    </motion.nav>
  )
}

export function CountBadge({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-[1.0625rem] min-w-[1.0625rem] place-items-center rounded-full bg-coral px-1 text-[0.65625rem] font-extrabold text-[#2e1410] tabular-nums",
        className,
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  )
}
