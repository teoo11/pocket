"use client"

import { Languages, LogOut, Moon, Settings, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useTransition } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/features/auth/actions"
import { setLocale } from "@/i18n/actions"
import { LOCALES } from "@/i18n/config"

export type MenuUser = { id: string; name: string; avatarUrl: string | null } | null

/** Avatar menu: my profile, appearance, language and log out. */
export function AccountMenu({ user }: { user: MenuUser }) {
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const [, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={user ? t("nav.account") : t("prefs.settings")}
        className="ml-1 grid size-[2.875rem] place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {user ? (
          <Avatar className="size-[2.375rem]">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-brand-soft font-extrabold text-brand-text">
              {(user.name || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Settings className="size-[1.375rem] text-muted-foreground" strokeWidth={1.7} aria-hidden />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {user ? (
          <>
            <DropdownMenuLabel className="text-base font-bold text-foreground">{user.name}</DropdownMenuLabel>
            <DropdownMenuItem asChild className="min-h-11">
              <Link href={`/profile/${user.id}`}>
                <UserRound aria-hidden />
                {t("account.myProfile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Moon className="size-4" aria-hidden />
          {t("prefs.theme")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          {(["light", "dark", "system"] as const).map((v) => (
            <DropdownMenuRadioItem key={v} value={v} className="min-h-11">
              {t(`prefs.themes.${v}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Languages className="size-4" aria-hidden />
          {t("prefs.language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(next) =>
            startTransition(async () => {
              await setLocale(next)
              router.refresh()
            })
          }
        >
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l} lang={l} className="min-h-11">
              {t(`prefs.languages.${l}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {user ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11" onSelect={() => startTransition(() => signOut())}>
              <LogOut aria-hidden />
              {t("account.logOut")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
