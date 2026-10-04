import { AppShell, Page, PublicHeader } from "@/components/shell/app-shell"
import { getShellCounts } from "@/features/notifications/queries"
import { avatarUrl, getViewer } from "@/features/profiles/queries"

/** Public pages (rules for minors, help, legal, contact): inside the app frame when signed in, otherwise a simple header. */
export default async function InfoLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer()
  if (viewer?.profile.onboarded_at) {
    const counts = await getShellCounts(viewer.id)
    return (
      <AppShell
        user={{ id: viewer.id, name: viewer.profile.display_name, avatarUrl: avatarUrl(viewer.profile.avatar_path) }}
        unread={counts.unread}
        needsYou={counts.needsYou}
        chats={counts.chats}
      >
        <Page>{children}</Page>
      </AppShell>
    )
  }
  return (
    <>
      <PublicHeader />
      <Page>{children}</Page>
    </>
  )
}
