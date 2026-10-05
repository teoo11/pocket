"use client"

import { ArrowLeft, Check, CircleDollarSign, Clock, Hourglass, List, Lock, MapPin, PencilLine, Sun, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useReducer, useState, useTransition } from "react"
import { toast } from "sonner"

import { Banner } from "@/components/banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DateField, TimeRange } from "@/components/watermelon/date-picker-11"
import { StepIndicator, type StepItem } from "@/components/watermelon/step-indicator"
import { Stepper } from "@/components/watermelon/stepper"
import { AddressPicker } from "@/features/maps/components/address-picker"
import { useMapsEnabled, useMapsFailed } from "@/features/maps/components/maps-provider"
import { PlacePicker } from "@/features/maps/components/place-picker"
import { addDays, fmtTime, nextDow } from "@/lib/dates"
import { fmtDur, longDate, shortDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { CATEGORY_KEYS, type CategoryKey } from "../categories"
import { CategoryTile } from "../components/job-bits"
import { MinorsNoteClient } from "./minors-note-client"
import { parseJob, suggestPay } from "../parse-job"
import { jobPhotoUrl } from "../photos"
import { hasBlockedWords } from "../safety"
import { createJob } from "./actions"
import { PhotoPicker } from "./photo-picker"

type Draft = {
  step: number
  category: CategoryKey | null
  categoryLabel: string
  text: string
  title: string
  parsedText: string | null
  date: string
  startMin: number
  durMin: number
  payLei: number
  payTouched: boolean
  placeName: string
  lat: number
  lng: number
  address: string
  photos: string[]
}

const STORAGE_KEY = "pocket-post-draft"
const STEP_COUNT = 8

type Action = { type: "set"; patch: Partial<Draft> }

function reducer(state: Draft, action: Action): Draft {
  return { ...state, ...action.patch }
}

export function PostWizard({ today, home, userId }: { today: string; home: { lat: number; lng: number; label: string }; userId: string }) {
  const t = useTranslations("post")
  const tc = useTranslations("categories")
  const tTime = useTranslations("time")
  const tErr = useTranslations("errors")
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const maps = useMapsEnabled()
  const mapsFailed = useMapsFailed()

  const blank: Draft = {
    step: 0,
    category: null,
    categoryLabel: "",
    text: "",
    title: "",
    parsedText: null,
    date: addDays(today, 1),
    startMin: 1020,
    durMin: 30,
    payLei: 25,
    payTouched: false,
    placeName: home.label,
    lat: home.lat,
    lng: home.lng,
    address: "",
    photos: [],
  }
  // Rendered only in the browser (see client.tsx), so the saved draft can seed the first render.
  const [d, dispatch] = useReducer(reducer, blank, (initial): Draft => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      return saved ? { ...initial, ...JSON.parse(saved) } : initial
    } catch {
      return initial
    }
  })
  const set = (patch: Partial<Draft>) => dispatch({ type: "set", patch })
  const [error, setError] = useState<string | null>(null)

  // Keep the draft if the page reloads (same tab only).
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d))
    } catch {}
  }, [d])

  const steps: StepItem[] = [
    { id: "kind", label: t("short.kind"), icon: List },
    { id: "details", label: t("short.details"), icon: PencilLine },
    { id: "day", label: t("short.day"), icon: Sun },
    { id: "time", label: t("short.time"), icon: Clock },
    { id: "length", label: t("short.length"), icon: Hourglass },
    { id: "pay", label: t("short.pay"), icon: CircleDollarSign },
    { id: "place", label: t("short.place"), icon: MapPin },
    { id: "check", label: t("short.check"), icon: Check },
  ]

  const blocked = hasBlockedWords(`${d.text} ${d.title} ${d.categoryLabel}`)
  const canNext = (() => {
    switch (d.step) {
      case 0:
        return !!d.category && (d.category !== "other" || d.categoryLabel.trim().length >= 2)
      case 1:
        return !blocked
      case 7:
        return d.title.trim().length >= 3 && !blocked
      default:
        return true
    }
  })()

  const goTo = (step: number) => {
    setError(null)
    set({ step })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const next = () => {
    if (!canNext) return
    // Leaving "Details": read the text once and pre-fill day, time, length, pay and title.
    if (d.step === 1 && d.parsedText !== d.text) {
      const p = parseJob(d.text, today)
      const durMin = p.durMin ?? d.durMin
      const category = d.category ?? p.category ?? "other"
      set({
        parsedText: d.text,
        date: p.date && p.date >= today ? p.date : d.date,
        startMin: p.startMin ?? d.startMin,
        durMin,
        payLei: p.payLei ?? (d.payTouched ? d.payLei : suggestPay(category, durMin)),
        payTouched: p.payLei ? true : d.payTouched,
        title:
          d.title ||
          (p.title && p.category === d.category ? t(`titles.${p.title}`) : category === "other" ? d.categoryLabel.trim() : tc(category)),
      })
    }
    goTo(d.step + 1)
  }

  const submit = () =>
    startTransition(async () => {
      if (!d.category) return
      const r = await createJob({
        category: d.category,
        categoryLabel: d.category === "other" ? d.categoryLabel : "",
        title: d.title,
        description: d.text,
        date: d.date,
        startMin: d.startMin,
        durMin: d.durMin,
        payLei: d.payLei,
        lat: d.lat,
        lng: d.lng,
        address: d.address,
        photos: d.photos,
      })
      if (!r.ok) {
        setError(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
        return
      }
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {}
      toast.success(t("posted"))
      if (r.data!.photosFailed) toast.error(t("photos.attachFailed"))
      router.push(`/jobs/${r.data!.id}`)
    })

  const option = (key: string, on: boolean, onClick: () => void, main: React.ReactNode, sub?: React.ReactNode, icon?: React.ReactNode) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-2xl border-[1.6px] border-input bg-card px-4 py-3 text-left shadow-wm-xs hover:bg-wm-tile",
        on && "border-foreground bg-foreground text-background hover:bg-foreground",
      )}
    >
      {icon}
      <span className="flex flex-col">
        <span className="text-[1.0625rem] font-bold">{main}</span>
        {sub ? <small className={cn("text-[0.90625rem]", on ? "text-background/75" : "text-muted-foreground")}>{sub}</small> : null}
      </span>
    </button>
  )

  const dayOptions: [string, string][] = [
    [today, tTime("today")],
    [addDays(today, 1), tTime("tomorrow")],
    [nextDow(today, 6), t("saturday")],
    [nextDow(today, 0), t("sunday")],
  ]
  const timeOptions: [number, string][] = [
    [540, t("morning")],
    [720, t("midday")],
    [900, t("afternoon")],
    [1020, t("afternoon")],
    [1080, t("evening")],
    [1140, t("evening")],
  ]

  let body: React.ReactNode = null
  switch (d.step) {
    case 0:
      body = (
        <>
          <div role="radiogroup" aria-label={t("titles.0")} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CATEGORY_KEYS.map((k) => option(k, d.category === k, () => set({ category: k }), tc(k), undefined, <CategoryTile category={k} size="sm" />))}
          </div>
          {d.category === "other" ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="post-cat-label" className="font-semibold">
                {t("otherLabel")}
              </label>
              <Input id="post-cat-label" value={d.categoryLabel} maxLength={30} placeholder={t("otherPlaceholder")} onChange={(e) => set({ categoryLabel: e.target.value })} />
            </div>
          ) : null}
        </>
      )
      break
    case 1:
      body = (
        <div className="flex flex-col gap-2">
          <label htmlFor="post-text" className="font-semibold">
            {t("detailsLabel")}
          </label>
          <Textarea id="post-text" className="min-h-40" maxLength={1000} value={d.text} placeholder={t("detailsPlaceholder")} onChange={(e) => set({ text: e.target.value })} />
          {blocked ? (
            <Banner tone="coral" icon={TriangleAlert} title={t("blockedTitle")}>
              {t("blockedBody")}
            </Banner>
          ) : null}
          <PhotoPicker userId={userId} paths={d.photos} onChange={(photos) => set({ photos })} />
        </div>
      )
      break
    case 2:
      body = (
        <>
          <div role="radiogroup" aria-label={t("titles.2")} className="grid grid-cols-2 gap-2.5">
            {dayOptions.map(([v, l]) => option(`${v}-${l}`, d.date === v, () => set({ date: v }), l, shortDate(v, locale)))}
          </div>
          <DateField label={t("anotherDay")} value={d.date} onChange={(date) => set({ date })} today={today} locale={locale} />
          <p className="text-lg">{t.rich("chosen", { value: longDate(d.date, locale), b: (c) => <b>{c}</b> })}</p>
        </>
      )
      break
    case 3:
      body = (
        <>
          <div role="radiogroup" aria-label={t("titles.3")} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {timeOptions.map(([v, l]) => option(String(v), d.startMin === v, () => set({ startMin: v, durMin: Math.min(d.durMin, 1439 - v) }), fmtTime(v), l))}
          </div>
          <TimeRange fromLabel={t("from")} toLabel={t("to")} start={d.startMin} dur={d.durMin} onChange={(startMin, durMin) => set({ startMin, durMin: Math.max(5, durMin) })} />
          <p className="text-lg">
            {t.rich("chosen", { value: `${fmtTime(d.startMin)} – ${fmtTime(Math.min(1439, d.startMin + d.durMin))} (${fmtDur(d.durMin)})`, b: (c) => <b>{c}</b> })}
          </p>
        </>
      )
      break
    case 4:
      body = (
        <>
          <Stepper
            value={d.durMin}
            onChange={(durMin) => set({ durMin, payLei: d.payTouched ? d.payLei : suggestPay(d.category, durMin) })}
            step={15}
            min={15}
            max={600}
            unit="min"
            label={t("howLong")}
            lessLabel={t("less")}
            moreLabel={t("more")}
          />
          <div role="radiogroup" aria-label={t("titles.4")} className="grid grid-cols-3 gap-2.5">
            {[15, 30, 45, 60, 90, 120].map((v) => option(String(v), d.durMin === v, () => set({ durMin: v, payLei: d.payTouched ? d.payLei : suggestPay(d.category, v) }), fmtDur(v)))}
          </div>
          <NumberField id="post-dur" label={t("typeMinutes")} unit="min" value={d.durMin} min={5} max={600} onChange={(durMin) => set({ durMin })} />
        </>
      )
      break
    case 5:
      body = (
        <>
          <Stepper
            value={d.payLei}
            onChange={(payLei) => set({ payLei, payTouched: true })}
            step={5}
            min={10}
            max={5000}
            unit="lei"
            label={t("youPay")}
            lessLabel={t("less")}
            moreLabel={t("more")}
          />
          <p className="text-muted-foreground">
            {t.rich("payHint", { dur: fmtDur(d.durMin), suggested: suggestPay(d.category, d.durMin), b: (c) => <b>{c}</b> })}
          </p>
          <div role="radiogroup" aria-label={t("titles.5")} className="grid grid-cols-3 gap-2.5">
            {[15, 20, 25, 30, 40, 50].map((v) => option(String(v), d.payLei === v, () => set({ payLei: v, payTouched: true }), `${v} lei`))}
          </div>
          <NumberField id="post-pay" label={t("ownAmount")} unit="lei" value={d.payLei} min={10} max={5000} onChange={(payLei) => set({ payLei, payTouched: true })} />
        </>
      )
      break
    case 6:
      body = maps ? (
        <>
          {/* Without a working map, the neighbourhood list places the job. */}
          {mapsFailed ? (
            <PlacePicker
              label={t("neighbourhood")}
              value={d.placeName ? { id: 0, name: d.placeName, zone: "", lat: d.lat, lng: d.lng } : null}
              onChange={(p) => set({ placeName: p.name, lat: p.lat, lng: p.lng })}
            />
          ) : null}
          <AddressPicker
            id="post-address"
            label={t("street")}
            placeholder={t("streetPlaceholder")}
            value={{ lat: d.lat, lng: d.lng, address: d.address }}
            onChange={(v) => set({ lat: v.lat, lng: v.lng, address: v.address, placeName: v.area })}
          />
          <p className="-mt-2 flex items-center gap-1.5 text-[0.9375rem] text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            {t("streetPrivate")}
          </p>
        </>
      ) : (
        <>
          <PlacePicker
            label={t("neighbourhood")}
            value={d.placeName ? { id: 0, name: d.placeName, zone: "", lat: d.lat, lng: d.lng } : null}
            onChange={(p) => set({ placeName: p.name, lat: p.lat, lng: p.lng })}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="post-address" className="font-semibold">
              {t("street")}
            </label>
            <Input id="post-address" value={d.address} maxLength={200} autoComplete="street-address" placeholder={t("streetPlaceholder")} onChange={(e) => set({ address: e.target.value })} />
            <p className="flex items-center gap-1.5 text-[0.9375rem] text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
              {t("streetPrivate")}
            </p>
          </div>
        </>
      )
      break
    case 7: {
      const row = (label: string, value: React.ReactNode, step: number) => (
        <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[0.90625rem] text-faint">{label}</span>
            <b className="break-words">{value}</b>
          </span>
          <Button variant="quiet" size="sm" onClick={() => goTo(step)}>
            {t("change")}
          </Button>
        </div>
      )
      body = (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="post-title" className="font-semibold">
              {t("titleLabel")}
            </label>
            <Input id="post-title" className="font-bold" value={d.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div className="rounded-3xl border-[1.6px] border-border bg-card px-4 shadow-wm-xs">
            {row(t("kind"), d.category === "other" ? d.categoryLabel : d.category ? tc(d.category) : "", 0)}
            {d.text ? row(t("whatYouWrote"), d.text, 1) : null}
            {d.photos.length
              ? row(
                  t("photos.label"),
                  <span className="mt-1 flex gap-1.5">
                    {d.photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element -- the person's own upload
                      <img key={p} src={jobPhotoUrl(p)} alt="" className="size-14 border border-border object-cover" />
                    ))}
                  </span>,
                  1,
                )
              : null}
            {row(t("short.day"), longDate(d.date, locale), 2)}
            {row(t("short.time"), fmtTime(d.startMin), 3)}
            {row(t("howLong"), fmtDur(d.durMin), 4)}
            {row(t("short.pay"), `${d.payLei} lei`, 5)}
            {row(t("short.place"), [d.placeName, d.address].filter(Boolean).join(", "), 6)}
          </div>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="size-4" aria-hidden />
            {t("privacyNote")}
          </p>
          {d.category ? <MinorsNoteClient category={d.category} startMin={d.startMin} durMin={d.durMin} /> : null}
          {blocked ? (
            <Banner tone="coral" icon={TriangleAlert} title={t("blockedTitle")}>
              {t("blockedBody")}
            </Banner>
          ) : null}
        </>
      )
      break
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {d.step === 0 ? (
        <Link href="/" className="flex min-h-12 items-center gap-1.5 self-start font-semibold text-muted-foreground no-underline">
          <ArrowLeft className="size-5" aria-hidden />
          {t("cancel")}
        </Link>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-faint">{t("stepOf", { n: d.step + 1, total: STEP_COUNT })}</p>
        <StepIndicator steps={steps} current={d.step} onGoTo={goTo} stepLabel={(i) => t("stepLabel", { n: i + 1, total: STEP_COUNT, name: steps[i].label })} />
      </div>
      <h1 className="text-[1.875rem]">{t(`titles.${d.step}`)}</h1>
      {body}
      {error ? (
        <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 font-semibold text-coral-text">
          {error}
        </p>
      ) : null}
      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] z-10 -mx-4 flex gap-2.5 bg-background/95 px-4 py-3 backdrop-blur desk:bottom-0">
        {d.step > 0 ? (
          <Button variant="outline" size="lg" onClick={() => goTo(d.step - 1)}>
            <ArrowLeft aria-hidden />
            {t("back")}
          </Button>
        ) : null}
        {d.step === STEP_COUNT - 1 ? (
          <Button size="lg" className="flex-1" disabled={!canNext || pending} onClick={submit}>
            {pending ? t("posting") : t("postIt")}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" disabled={!canNext} onClick={next}>
            {t("next")}
          </Button>
        )}
      </div>
    </div>
  )
}

function NumberField({ id, label, unit, value, min, max, onChange }: { id: string; label: string; unit: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value))
  const [last, setLast] = useState(value)
  if (value !== last) {
    setLast(value)
    setText(String(value))
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const n = Math.round(Number(e.target.value))
            if (n >= min && n <= max) onChange(n)
          }}
          className="pr-14"
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-faint">{unit}</span>
      </div>
    </div>
  )
}
