import { ArrowLeft, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { Page } from "@/components/shell/app-shell"
import { UserAvatar } from "@/components/user-avatar"
import { ChatThread } from "@/features/chat/components/chat-thread"
import { getConversation } from "@/features/chat/queries"
import { ReportButton } from "@/features/moderation/components/report-button"
import { requireViewer } from "@/features/profiles/queries"

const UUID = /^[0-9a-f-]{36}$/i

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("chat"))("title") }
}

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const viewer = await requireViewer()
  const convo = await getConversation(id, viewer.id)
  if (!convo) notFound()
  const t = await getTranslations("chat")
  const name = convo.other?.display_name ?? t("someone")

  return (
    <Page className="gap-4">
      <div className="flex items-center gap-2">
        <Link href="/messages" className="flex size-12 items-center justify-center text-muted-foreground" aria-label={t("back")}>
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <UserAvatar name={name} path={convo.other?.avatar_path} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-xl">
            {convo.other ? (
              <Link href={`/profile/${convo.other.id}`} className="text-foreground no-underline hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
          </h1>
          <Link href={`/jobs/${convo.jobId}`} className="truncate text-[0.9375rem] font-semibold text-brand-text">
            {convo.jobTitle}
          </Link>
        </div>
        {convo.other ? <ReportButton kind="user" targetId={convo.other.id} label={t("reportPerson")} iconOnly /> : null}
      </div>

      <p className="flex items-start gap-2 rounded-2xl bg-sage-soft px-4 py-3 text-[0.9375rem] text-sage-text">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {convo.iAmPoster ? t("safetyPoster") : t("safetyHelper")}
      </p>

      <ChatThread conversationId={convo.id} viewerId={viewer.id} initial={convo.messages} closed={convo.closed} />
    </Page>
  )
}
