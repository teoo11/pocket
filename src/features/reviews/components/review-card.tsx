import { useTranslations } from "next-intl"

import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"

type Review = {
  stars: number
  tags: string[] | null
  comment: string | null
  subject_role: "helper" | "poster"
}

/** Stars as text with an accessible label ("4 stars"). */
export function Stars({ n, className }: { n: number; className?: string }) {
  const t = useTranslations("review")
  return (
    <span className={cn("font-bold whitespace-nowrap text-sun-text", className)}>
      <span aria-hidden>
        {"★".repeat(n)}
        <span className="opacity-30">{"★".repeat(5 - n)}</span>
      </span>
      <span className="sr-only">{t("starN", { count: n })}</span>
    </span>
  )
}

export function TagChips({ tags, counts }: { tags: string[]; counts?: number[] }) {
  const t = useTranslations("review")
  if (!tags.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <li key={tag} className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-text">
          {t.has(`tags.${tag}`) ? t(`tags.${tag}`) : tag}
          {counts ? <span className="ml-1 opacity-75 tabular-nums">×{counts[i]}</span> : null}
        </li>
      ))}
    </ul>
  )
}

/** One review: who wrote it (optional), stars, as helper/poster, date, tags and comment. */
export function ReviewCard({
  review,
  author,
  date,
  heading,
  showRole = true,
}: {
  review: Review
  author?: { name: string | null; avatarPath: string | null } | null
  date?: string
  heading?: string
  /** "as a helper" / "as a poster"; not needed where the job already says who is who. */
  showRole?: boolean
}) {
  const t = useTranslations()
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-[1.6px] border-border bg-card px-4 py-3">
      {heading ? <span className="text-sm font-bold tracking-wide text-faint uppercase">{heading}</span> : null}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {author ? (
          <span className="flex items-center gap-2 font-semibold">
            <UserAvatar name={author.name} path={author.avatarPath} size="sm" />
            {author.name ?? t("profile.someone")}
          </span>
        ) : null}
        <Stars n={review.stars} />
        {showRole || date ? (
          <span className="text-sm text-muted-foreground">{[showRole && t(`profile.as.${review.subject_role}`), date].filter(Boolean).join(" · ")}</span>
        ) : null}
      </div>
      <TagChips tags={review.tags ?? []} />
      {review.comment ? <p>“{review.comment}”</p> : null}
    </div>
  )
}
