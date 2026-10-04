/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: asChild (wrap a Link), a one-time shimmer on first paint, reduced-motion support.
 */
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  asChild?: boolean
}

export function ShimmerButton({ children, className, asChild = false, ...props }: ShimmerButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      className={cn(
        "group relative isolate overflow-hidden rounded-lg px-6 py-3 font-semibold",
        "bg-primary text-primary-foreground transition-shadow duration-300 hover:shadow-lg",
        // light sweep: once shortly after it appears, then on hover
        "after:absolute after:inset-0 after:-z-10 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-white/25 after:to-transparent",
        "after:animate-[wm-shimmer-once_1.4s_0.6s_ease-in-out_1] after:transition-transform after:duration-700 hover:after:translate-x-full",
        "motion-reduce:after:animate-none",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}
