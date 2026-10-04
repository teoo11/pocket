"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { CountBadge, Dock } from "@/components/watermelon/dock"
import { cn } from "@/lib/utils"

import { activeNav, NAV_ITEMS, type NavKey } from "./nav-items"

type Badges = Partial<Record<NavKey, number>>

/** Desktop: tabs in the top bar. */
export function TopNav({ badges = {} }: { badges?: Badges }) {
  const t = useTranslations("nav")
  const active = activeNav(usePathname())
  return (
    <nav aria-label={t("main")} className="ml-5 hidden self-stretch desk:flex">
      {NAV_ITEMS.map(({ key, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          className={cn(
            "relative flex items-center gap-[7px] px-3.5 text-[0.90625rem] font-bold text-muted-foreground no-underline hover:text-foreground",
            active === key &&
              "text-foreground after:absolute after:inset-x-3 after:-bottom-2 after:h-[3px] after:rounded-t-[3px] after:bg-primary",
          )}
        >
          <Icon className="size-[1.375rem]" strokeWidth={1.7} aria-hidden />
          {t(key)}
          {badges[key] ? <CountBadge n={badges[key]} /> : null}
        </Link>
      ))}
    </nav>
  )
}

/** Phone: the floating Watermelon dock at the bottom. */
export function BottomDock({ badges = {} }: { badges?: Badges }) {
  const t = useTranslations("nav")
  const active = activeNav(usePathname())
  return (
    <div className="fixed bottom-[calc(0.625rem+env(safe-area-inset-bottom,0px))] left-1/2 z-30 -translate-x-1/2 desk:hidden">
      <Dock
        label={t("main")}
        items={NAV_ITEMS.map(({ key, href, icon }) => ({
          href,
          label: t(key),
          Icon: icon,
          active: active === key,
          badge: badges[key],
        }))}
      />
    </div>
  )
}
