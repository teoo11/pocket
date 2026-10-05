import { ArrowLeft, CheckCircle2, Clock, Coins, Lock, X } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"

import { Banner } from "@/components/banner"
import { Page } from "@/components/shell/app-shell"
import { levelOf } from "@/features/gamification/levels"
import type { CategoryKey } from "@/features/jobs/categories"
import {
  CancelJobButton,
  ConfirmButton,
  FinishDialog,
  JobLiveRefresh,
  OfferButton,
  PickButton,
  ReviewForm,
  StartButton,
  WithdrawButton,
} from "@/features/jobs/components/job-actions"
import { MessageButton } from "@/features/chat/components/message-button"
import { getJobConversations } from "@/features/chat/queries"
import { JobThumb, useWhen } from "@/features/jobs/components/job-bits"
import { ContactBox, Facts, HelperRow, JobPhotos, MinorsNote, PayProgress, PersonRow, PointsBox } from "@/features/jobs/components/job-details"
import { isMatched, nextSteps, roleOf } from "@/features/jobs/lifecycle"
import { getSearchOrigin } from "@/features/jobs/origin"
import { getJobCard, getJobContact, getJobPhotos, getJobPlace, getMyJobs, getOfferCandidates } from "@/features/jobs/queries"
import { JobMiniMap } from "@/features/maps/components/job-mini-map"
import { ReportButton } from "@/features/moderation/components/report-button"
import { ReviewCard } from "@/features/reviews/components/review-card"
import { getJobReviews } from "@/features/reviews/queries"
import { type CardState, PayChoice } from "@/features/payments/components/pay-choice"
import { halves } from "@/features/payments/money"
import { requireViewer } from "@/features/profiles/queries"
import { fmtDist, fmtDur } from "@/lib/format"
import { stripeEnabled } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const job = await getJobCard((await params).id)
  return { title: job?.title ?? undefined }
}

function When({ job }: { job: Parameters<ReturnType<typeof useWhen>>[0] }) {
  const when = useWhen()
  return <>{when(job).split(" · ")[0]}</>
}

export default async function JobPage({ params, searchParams }: PageProps<"/jobs/[id]">) {
  const { id } = await params
  const { card: cardResult } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const viewer = await requireViewer()
  // Distances as in the search: from "near me now" when set, otherwise from home.
  const [job, my, photos] = await Promise.all([getJobCard(id, await getSearchOrigin()), getMyJobs(viewer.id), getJobPhotos(id)])
  if (!job) notFound()

  const t = await getTranslations()
  const locale = await getLocale()
  const ctx = my.contextFor(job.id)
  const role = roleOf(job, ctx)
  const steps = nextSteps(job, ctx)
  const matched = isMatched(job.status) && (role === "poster" || role === "helper")
  const supabase = await createClient()

  const involved = role === "poster" || role === "helper" || ctx.myOffer === "pending" || ctx.myOffer === "declined"
  const reviewable = (role === "poster" || role === "helper") && ["completed", "paid"].includes(job.status)
  // Paying by card: the poster sees Cash | Card when Pocket takes cards; Card needs a helper who can receive it.
  const paying = role === "poster" && ["started", "done", "completed"].includes(job.status)
  const [contact, candidates, posterStats, conversations, reviews, myPlace, helperCard, pendingCards] = await Promise.all([
    matched ? getJobContact(job.id) : Promise.resolve(null),
    role === "poster" && job.status === "open" ? getOfferCandidates(job.id) : Promise.resolve([]),
    job.poster_id
      ? supabase.from("profile_stats").select("points, jobs_posted, poster_rating").eq("user_id", job.poster_id).maybeSingle()
      : Promise.resolve({ data: null }),
    involved ? getJobConversations(job.id) : Promise.resolve(new Map<string, { id: string; closed: boolean }>()),
    reviewable ? getJobReviews(job.id, viewer.id) : Promise.resolve({ mine: null, theirs: null }),
    role === "poster" ? getJobPlace(job.id) : Promise.resolve(null),
    paying && stripeEnabled() && job.helper_id
      ? supabase.from("profiles").select("accepts_card").eq("id", job.helper_id).maybeSingle()
      : Promise.resolve({ data: null }),
    paying
      ? supabase.from("payments").select("part").eq("job_id", job.id).eq("method", "card").eq("status", "pending")
      : Promise.resolve({ data: [] as { part: number }[] }),
  ])
  const card: CardState = !paying ? "off" : !stripeEnabled() ? "soon" : helperCard.data?.accepts_card ? "on" : "cashOnly"
  const cardPending = (part: number) => (pendingCards.data ?? []).some((p) => p.part === part)
  // Exact point for the poster and the picked helper; everyone else gets the shifted public point as an area.
  const mapPoint =
    myPlace ?? (role === "helper" && contact?.lat != null && contact.lng != null ? { lat: contact.lat, lng: contact.lng } : null)
  // The helper's (or offering person's) own conversation; the poster's one with the picked helper.
  const myConversation = role === "poster" ? (job.helper_id ? conversations.get(job.helper_id) : undefined) : conversations.get(viewer.id)

  const [h1, h2] = halves(job.pay_lei ?? 0)
  const firstPaid = !!job.half1_paid_at
  const allPaid = job.status === "paid"
  const otherName = contact?.other_name ?? ""
  const otherFirst = otherName.split(" ")[0]
  const posterFirst = (job.poster_name ?? "").split(" ")[0]
  const minutes = job.minutes ?? job.dur_min ?? 0
  const finished = ["done", "completed", "paid"].includes(job.status)
  const restLei = firstPaid ? h2 : (job.pay_lei ?? 0)

  return (
    <Page>
      <JobLiveRefresh jobId={job.id} />
      <div className="flex items-center justify-between">
        <Link href="/" className="flex min-h-12 items-center gap-1.5 font-semibold text-muted-foreground no-underline">
          <ArrowLeft className="size-5" aria-hidden />
          {t("common.back")}
        </Link>
        <ReportButton kind="job" targetId={job.id} label={t("report.short")} />
      </div>

      {cardResult === "paid" ? (
        <Banner tone="brand" icon={CheckCircle2} title={t("pay.paidTitle")}>
          {t("pay.paidBody", { name: otherFirst })}
        </Banner>
      ) : cardResult === "cancelled" ? (
        <Banner tone="grey" icon={X} title={t("pay.cancelledTitle")}>
          {t("pay.cancelledBody")}
        </Banner>
      ) : cardResult === "processing" ? (
        <Banner tone="sky" icon={Clock} title={t("pay.processingTitle")}>
          {t("pay.processingBody")}
        </Banner>
      ) : null}
      <JobThumb job={job} mine={role === "poster"} big />
      <h1 className="text-[1.875rem]">{job.title}</h1>
      <Facts
        items={[
          { label: t("job.pay"), value: t("common.lei", { amount: job.pay_lei ?? 0 }), note: t("job.payNote") },
          { label: t("job.when"), value: <When job={job} /> },
          { label: t("job.howLong"), value: fmtDur(job.dur_min ?? 0) },
          {
            label: t("job.where"),
            value: `${job.area_label}${role !== "poster" && job.dist_m != null ? ` · ${fmtDist(job.dist_m, locale)}` : ""}`,
          },
        ]}
      />
      <PointsBox minutes={minutes} earned={finished} who={role === "helper" ? "you" : role === "poster" ? "yourHelper" : "theHelper"} />
      {job.description ? <p className="text-lg whitespace-pre-line">{job.description}</p> : null}
      <JobPhotos paths={photos} />
      {mapPoint ? (
        <JobMiniMap key="exact" lat={mapPoint.lat} lng={mapPoint.lng} exact />
      ) : job.lat != null && job.lng != null ? (
        <JobMiniMap key="area" lat={job.lat} lng={job.lng} exact={false} />
      ) : null}

      {role !== "poster" && job.poster_id ? (
        <PersonRow
          href={`/profile/${job.poster_id}`}
          name={job.poster_name ?? ""}
          avatarPath={job.poster_avatar}
          level={levelOf(posterStats.data?.points ?? 0).n}
          isExample={job.is_example ?? false}
          subtitle={
            posterStats.data?.poster_rating
              ? t("job.posterRecord", { rating: posterStats.data.poster_rating.toFixed(1), count: posterStats.data.jobs_posted ?? 0 })
              : t("job.seeProfile")
          }
        />
      ) : null}

      {/* ── Poster ── */}
      {role === "poster" && job.status === "open" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">{candidates.length ? t("job.offersTitle", { count: candidates.length }) : t("job.noOffers")}</h2>
          <p className="text-muted-foreground">{candidates.length ? t("job.offersHint") : t("job.noOffersHint")}</p>
          {candidates.map((c) => (
            <HelperRow
              key={c.offer_id}
              helperId={c.helper_id}
              name={c.display_name}
              avatarPath={c.avatar_path}
              isExample={c.is_example}
              rating={c.helper_rating}
              jobsDone={c.jobs_done ?? 0}
              distM={c.dist_m}
              level={levelOf(c.points ?? 0).n}
              locale={locale}
            >
              <div className="flex flex-wrap gap-2">
                <PickButton jobId={job.id} offerId={c.offer_id} name={c.display_name.split(" ")[0]} />
                {conversations.get(c.helper_id) ? (
                  <MessageButton
                    conversationId={conversations.get(c.helper_id)!.id}
                    label={t("chat.message", { name: c.display_name.split(" ")[0] })}
                  />
                ) : null}
              </div>
            </HelperRow>
          ))}
        </section>
      ) : null}

      {matched && contact ? (
        <>
          <Banner tone="brand" icon={CheckCircle2} title={role === "poster" ? t("job.isHelping", { name: otherName }) : t("job.pickedYou", { name: otherFirst })}>
            {job.started_at && job.status === "started"
              ? t("job.startedAt", { time: new Date(job.started_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" }) })
              : t("job.agreeDetails")}
          </Banner>
          <ContactBox
            name={otherName}
            avatarPath={contact.other_avatar}
            phone={contact.phone}
            address={role === "helper" ? contact.address : null}
            lat={role === "helper" ? contact.lat : null}
            lng={role === "helper" ? contact.lng : null}
          />
          {myConversation ? <MessageButton conversationId={myConversation.id} label={t("chat.message", { name: otherFirst })} /> : null}
        </>
      ) : null}

      {role === "poster" && job.status === "accepted" ? (
        <p className="flex items-start gap-2 text-muted-foreground">
          <Coins className="mt-1 size-4 shrink-0" aria-hidden />
          {t("job.twoParts", { first: h1, second: h2, name: otherFirst })}
        </p>
      ) : null}

      {steps.includes("payFirst") ? (
        <div className="flex flex-col gap-3 rounded-3xl border-[1.6px] border-border bg-card p-5 shadow-wm-xs">
          <span className="text-sm font-bold tracking-wide text-faint uppercase">{t("job.payment1")}</span>
          <h2 className="text-xl">{t("job.payFirstTitle", { amount: h1 })}</h2>
          <p className="text-muted-foreground">{t("job.payFirstBody", { name: otherFirst, rest: h2 })}</p>
          <PayChoice jobId={job.id} part={1} amountLei={h1} card={card} pendingCard={cardPending(1)} helperName={otherFirst} />
        </div>
      ) : null}

      {role === "poster" && job.status === "done" ? (
        <div className="flex flex-col gap-3 rounded-3xl border-[1.6px] border-sky bg-card p-5 shadow-wm-xs">
          <h2 className="text-xl">{t("job.saysDone", { name: otherFirst })}</h2>
          <p className="text-muted-foreground">{t.rich("job.timeSpent", { dur: fmtDur(minutes), b: (c) => <b>{c}</b> })}</p>
          <ConfirmButton jobId={job.id} />
          <ReportButton kind="job" targetId={job.id} label={t("job.somethingWrong")} />
        </div>
      ) : null}

      {steps.includes("payRest") ? (
        <div className="flex flex-col gap-3 rounded-3xl border-[1.6px] border-border bg-card p-5 shadow-wm-xs">
          <span className="text-sm font-bold tracking-wide text-faint uppercase">{t("job.payment2")}</span>
          <h2 className="text-xl">{firstPaid ? t("job.payRestTitle", { amount: restLei }) : t("job.payAllTitle", { amount: restLei })}</h2>
          <p className="text-muted-foreground">{t("job.payRestBody")}</p>
          <PayChoice jobId={job.id} part={2} amountLei={restLei} card={card} pendingCard={cardPending(2)} helperName={otherFirst} />
        </div>
      ) : null}

      {(role === "poster" || role === "helper") && ["started", "done", "completed", "paid"].includes(job.status) ? (
        <PayProgress halves={[h1, h2]} firstPaid={firstPaid} allPaid={allPaid} view={role} />
      ) : null}

      {/* ── Helper ── */}
      {steps.includes("start") ? (
        <>
          <StartButton jobId={job.id} />
          <p className="text-center text-muted-foreground">{t.rich("job.startNote", { name: posterFirst, first: h1, second: h2, b: (c) => <b>{c}</b> })}</p>
        </>
      ) : null}
      {steps.includes("finish") ? (
        <>
          <Banner tone="sky" icon={Clock} title={t("job.inProgressTitle")}>
            {t("job.inProgressBody")}
          </Banner>
          <FinishDialog jobId={job.id} plannedMin={job.dur_min ?? 30} startedAt={job.started_at} posterName={posterFirst} />
        </>
      ) : null}
      {role === "helper" && (job.status === "done" || job.status === "completed") ? (
        <Banner tone="sky" icon={Clock} title={t("job.waitingFor", { name: posterFirst })}>
          {t("job.waitingForBody")}
        </Banner>
      ) : null}

      {/* ── Reviews (both sides) ── */}
      {steps.includes("review") ? (
        <ReviewForm jobId={job.id} subjectRole={role === "poster" ? "helper" : "poster"} name={otherFirst} />
      ) : null}
      {reviews.theirs ? <ReviewCard review={reviews.theirs} showRole={false} heading={t("review.theirs", { name: otherFirst })} /> : null}
      {reviews.mine ? (
        <>
          <ReviewCard review={reviews.mine} showRole={false} heading={t("review.yours")} />
          {!reviews.theirs ? <p className="-mt-3 text-[0.9375rem] text-muted-foreground">{t("review.waitingTheirs", { name: otherFirst })}</p> : null}
        </>
      ) : null}
      {(role === "poster" || role === "helper") && job.status === "paid" && ctx.reviewed ? (
        <Banner tone="grey" icon={CheckCircle2} title={t("job.allDone")}>
          {t("job.allDoneBody")}
        </Banner>
      ) : null}

      {/* ── Everyone else ── */}
      {role !== "poster" && role !== "helper" ? (
        job.status !== "open" ? (
          <Banner tone="grey" icon={X} title={ctx.myOffer === "declined" ? t("job.pickedSomeoneElse", { name: posterFirst }) : t("job.taken")}>
            {ctx.myOffer === "declined" ? t("job.otherJobs") : t("job.takenBody")}
          </Banner>
        ) : (
          <>
            <MinorsNote job={{ category: (job.category ?? "other") as CategoryKey, start_min: job.start_min ?? 0, dur_min: job.dur_min ?? 0 }} />
            {steps.includes("withdraw") ? (
              <>
                <Banner tone="sun" icon={Clock} title={t("job.youOffered")}>
                  {t("job.youOfferedBody", { name: posterFirst })}
                </Banner>
                {myConversation ? (
                  <MessageButton conversationId={myConversation.id} label={t("chat.message", { name: posterFirst })} size="lg" />
                ) : null}
                <WithdrawButton jobId={job.id} />
              </>
            ) : job.is_example ? (
              <Banner tone="grey" icon={Lock} title={t("job.exampleTitle")}>
                {t("job.exampleBody")}
              </Banner>
            ) : (
              <>
                <OfferButton jobId={job.id} />
                <p className="text-center text-muted-foreground">{t("job.offerNote", { name: posterFirst })}</p>
              </>
            )}
          </>
        )
      ) : null}

      {steps.includes("cancel") ? <CancelJobButton jobId={job.id} matched={job.status === "accepted"} /> : null}
      <ReportButton kind="job" targetId={job.id} label={t("report.problem")} />
    </Page>
  )
}
