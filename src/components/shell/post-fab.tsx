"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { ShimmerButton } from "@/components/watermelon/shimmer-button"

/** The big "+ Post a job" button in the bottom-right corner of every signed-in page, hidden while posting or chatting. */
export function PostFab() {
  const t = useTranslations("nav")
  const path = usePathname()
  if (path.startsWith("/post") || path.startsWith("/messages/")) return null
  return (
    <nav aria-label={t("quickActions")}>
      <ShimmerButton
        asChild
        className="fixed right-4 bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] z-40 inline-flex h-15 items-center gap-2 rounded-full py-0 pr-6 pl-[1.125rem] text-lg font-extrabold no-underline shadow-fab hover:bg-primary-hover desk:right-7 desk:bottom-7 desk:h-16"
      >
        <Link href="/post">
          <Plus className="size-[1.625rem]" strokeWidth={2.6} aria-hidden />
          <span>{t("postJob")}</span>
        </Link>
      </ShimmerButton>
    </nav>
  )
}
