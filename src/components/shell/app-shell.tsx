import { Bell, MessageCircle, Search } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { CountBadge } from "@/components/watermelon/dock"
import { NotificationListener } from "@/features/notifications/components/notification-listener"
import { cn } from "@/lib/utils"

import { AccountMenu, type MenuUser } from "./account-menu"
import { Brand } from "./logo"
import { BottomDock, TopNav } from "./main-nav"
import { PostFab } from "./post-fab"
import { TextSizeButton } from "./text-size-button"

type ShellProps = {
  children: React.ReactNode
  user: MenuUser
  unread?: number
  needsYou?: number
  /** Conversations with unread messages. */
  chats?: number
}

/** Signed-in frame: top bar (logo, tabs on desktop, Aa, search, bell, avatar), the page, the phone dock and the Post button. */
export async function AppShell({ children, user, unread = 0, needsYou = 0, chats = 0 }: ShellProps) {
  const t = await getTranslations("nav")
  const badges = needsYou ? { myJobs: needsYou } : {}

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-card pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex min-h-15 max-w-[77.5rem] items-center gap-2.5 px-4 py-2">
          <Brand />
          <TopNav badges={badges} />
          <div className="ml-auto flex items-center gap-0.5">
            <TextSizeButton />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/search" aria-label={t("search")}>
                <Search strokeWidth={1.7} aria-hidden />
              </Link>
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/messages" aria-label={chats ? t("messagesUnread", { count: chats }) : t("messages")}>
                  <MessageCircle strokeWidth={1.7} aria-hidden />
                  {chats ? <CountBadge n={chats} className="absolute top-1 right-0.5" /> : null}
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/notifications" aria-label={t("notifications")}>
                <Bell strokeWidth={1.7} aria-hidden />
                {unread ? <CountBadge n={unread} className="absolute top-1 right-0.5" /> : null}
              </Link>
            </Button>
            <AccountMenu user={user} />
          </div>
        </div>
      </header>
      {user ? <NotificationListener userId={user.id} /> : null}
      {children}
      <BottomDock badges={badges} />
      <PostFab />
    </>
  )
}

/** The page column: 760px, or 1240px for wide pages (map, home on desktop). */
export function Page({ children, wide, className }: { children: React.ReactNode; wide?: boolean; className?: string }) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-col gap-6 px-4 pt-5 pb-40 desk:pb-32",
        wide ? "max-w-[77.5rem]" : "max-w-[47.5rem]",
        className,
      )}
    >
      {children}
    </main>
  )
}

/** Signed-out frame for public pages (rules for minors, help, legal): logo and Aa. */
export function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[47.5rem] items-center justify-between px-4 pt-4">
      <Brand href="/login" />
      <div className="flex items-center gap-1">
        <TextSizeButton />
        <AccountMenu user={null} />
      </div>
    </header>
  )
}
