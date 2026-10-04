import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { TONE_CLASSES, type Tone } from "@/lib/tones"

/** A tinted notice with an icon, a bold title and a line of text (the prototype's .banner). */
export function Banner({
  tone = "grey",
  icon: Icon,
  title,
  children,
  className,
}: {
  tone?: Tone
  icon: LucideIcon
  title: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div role="note" className={cn("flex gap-3 rounded-2xl px-4 py-3.5", TONE_CLASSES[tone], className)}>
      <Icon className="mt-0.5 size-[1.375rem] shrink-0" strokeWidth={1.7} aria-hidden />
      <div className="min-w-0">
        <strong className="block font-bold">{title}</strong>
        {children}
      </div>
    </div>
  )
}
