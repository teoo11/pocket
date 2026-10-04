import Link from "next/link"

import { ASSETS } from "@/config/pocket"
import { cn } from "@/lib/utils"

/** The prototype's logo mark (a pocket with a coin), or the team's drawing when ASSETS.logo is set. */
export function LogoMark({ className }: { className?: string }) {
  if (ASSETS.logo) {
    // eslint-disable-next-line @next/next/no-img-element -- team-provided asset, any format
    return <img src={ASSETS.logo} alt="" className={cn("size-[1.875rem] shrink-0 rounded-[9px]", className)} />
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-[1.875rem] shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#B5705A" />
      <path d="M9 11.5h14v6.3c0 4-3.1 7-7 7s-7-3-7-7z" fill="#FFF8F2" />
      <circle cx="16" cy="9" r="3.3" fill="#E8B66B" />
      <path d="M11.5 14.5h9" stroke="#B5705A" strokeWidth="1.4" strokeDasharray="1.8 1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-[1.375rem] font-extrabold tracking-[-0.03em] text-foreground hover:no-underline"
    >
      <LogoMark />
      pocket
    </Link>
  )
}
