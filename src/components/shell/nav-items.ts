import { House, List, type LucideIcon, Trophy, UserRound } from "lucide-react"

export type NavKey = "home" | "top" | "myJobs" | "me"

export const NAV_ITEMS: { key: NavKey; href: string; icon: LucideIcon }[] = [
  { key: "home", href: "/", icon: House },
  { key: "top", href: "/top", icon: Trophy },
  { key: "myJobs", href: "/my-jobs", icon: List },
  { key: "me", href: "/me", icon: UserRound },
]

/** Job pages, the map and search belong to Home, as in the prototype. */
export function activeNav(pathname: string): NavKey | null {
  if (pathname === "/" || pathname.startsWith("/jobs") || pathname.startsWith("/map") || pathname.startsWith("/search"))
    return "home"
  if (pathname.startsWith("/top")) return "top"
  if (pathname.startsWith("/my-jobs")) return "myJobs"
  if (pathname.startsWith("/me")) return "me"
  return null
}
