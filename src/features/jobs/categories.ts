import {
  BookOpen,
  Brush,
  Ellipsis,
  Laptop,
  Leaf,
  type LucideIcon,
  Package,
  PawPrint,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react"

import type { Tone } from "@/lib/tones"

/** Matches the `job_category` enum in the database. Labels live in messages (`categories.<key>`). */
export const CATEGORY_KEYS = [
  "pet",
  "tech",
  "tutoring",
  "carrying",
  "plants",
  "errands",
  "household",
  "creative",
  "computer",
  "other",
] as const
export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export const CATEGORIES: Record<CategoryKey, { tone: Tone; icon: LucideIcon }> = {
  pet: { tone: "coral", icon: PawPrint },
  tech: { tone: "sky", icon: Smartphone },
  tutoring: { tone: "plum", icon: BookOpen },
  carrying: { tone: "sun", icon: Package },
  plants: { tone: "sage", icon: Leaf },
  errands: { tone: "coral", icon: ShoppingBag },
  household: { tone: "sky", icon: Sparkles },
  creative: { tone: "plum", icon: Brush },
  computer: { tone: "sky", icon: Laptop },
  other: { tone: "grey", icon: Ellipsis },
}

export function isCategory(value: unknown): value is CategoryKey {
  return typeof value === "string" && (CATEGORY_KEYS as readonly string[]).includes(value)
}
