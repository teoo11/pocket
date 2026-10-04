import { AppShell } from "@/components/shell/app-shell"
import { LevelUpDialog } from "@/features/gamification/components/level-up-dialog"
import { getShellCounts } from "@/features/notifications/queries"
import { NewEarningsDialog } from "@/features/payments/components/new-earnings-dialog"
import { getNewEarnings } from "@/features/payments/queries"
import { avatarUrl, requireViewer } from "@/features/profiles/queries"

/** Every signed-in page: signed out -> /login, not set up yet -> /onboarding. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireViewer()

  const [counts, newEarnings] = await Promise.all([
    getShellCounts(viewer.id),
    getNewEarnings(viewer.id, viewer.private.earnings_seen_at),
  ])
  return (
    <AppShell
      user={{ id: viewer.id, name: viewer.profile.display_name, avatarUrl: avatarUrl(viewer.profile.avatar_path) }}
      unread={counts.unread}
      needsYou={counts.needsYou}
      chats={counts.chats}
    >
      {children}
      {/* One pop-up at a time: earnings first, then the level-up after it closes. */}
      {newEarnings.length ? (
        <NewEarningsDialog key={newEarnings.map((e) => e.id).join()} earnings={newEarnings} />
      ) : (
        <LevelUpDialog points={counts.points} lastSeen={viewer.private.last_seen_level} />
      )}
    </AppShell>
  )
}
